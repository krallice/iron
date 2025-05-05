from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum

app = FastAPI()

# Define allowed origins (adjust as needed)
origins = [
    "http://localhost:8080",  # Your React dev server
    "http://192.168.1.129:8080",  # Your React dev server
    "http://localhost:8000",  # Your FastAPI server (optional, for testing)
    # Add production frontend URL later, e.g., "https://yourdomain.com"
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow cookies/auth headers if needed
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],     # Allow all headers
)

# Existing 1RM models and functions
class OneRMRequest(BaseModel):
    weight: float
    reps: int
    formula: str

# New HLM models
class HLMStandardRequest(BaseModel):
    squat: float = 100.0
    pull: float = 100.0
    press: float = 100.0
    medium_reduction: float
    light_reduction: float

class HLMAlternateRequest(BaseModel):
    # Squats
    heavy_squat_name: str = "Squat"
    squat: float = 100.0
    
    # Presses
    primary_press: float = 100.0
    primary_press_name: str = "OHP"
    secondary_press: Optional[float] = None
    secondary_press_name: Optional[str] = None
    
    # Pulls
    pull: float = 100.0
    heavy_pull_name: str = "Deadlift"
    medium_pull: Optional[float] = None
    medium_pull_name: Optional[str] = None
    light_pull: Optional[float] = None
    light_pull_name: Optional[str] = None
    
    # Core Reductions
    medium_reduction: float
    light_reduction: float
    
    # Header Text
    header_text: Optional[str] = None

# New Wendler 5/3/1 models
class Template(str, Enum):
    DEFAULT = "default"
    FSL = "fsl"
    WIDOWMAKER = "widowmaker"
    PYRAMID = "pyramid"

class MaxType(str, Enum):
    TRAINING_MAX = "training_max"
    ONERM = "onerm"

class Wendler531Request(BaseModel):
    squat: float
    bench: float
    deadlift: float
    press: float
    active_lifts: Optional[List[str]] = None
    max_type: MaxType = MaxType.TRAINING_MAX
    tm_percentage: float = 90.0
    header_text: Optional[str] = None
    templates: Optional[List[Template]] = None
    fsl_params: Optional[dict] = None

class Wendler531Generator:
    TEMPLATE_PERCENTAGES = {
        Template.DEFAULT: 90.0,
        Template.FSL: 90.0,
        Template.WIDOWMAKER: 90.0,
        Template.PYRAMID: 90.0
    }

    STRUCTURE_CORE = [
        {"week": 1, "name": "Week 1 (5/5/5+)", "reps": ["5", "5", "5+"], "percentages": [0.65, 0.75, 0.85]},
        {"week": 2, "name": "Week 2 (3/3/3+)", "reps": ["3", "3", "3+"], "percentages": [0.70, 0.80, 0.90]},
        {"week": 3, "name": "Week 3 (5/3/1+)", "reps": ["5", "3", "1+"], "percentages": [0.75, 0.85, 0.95]},
        {"week": 4, "name": "Week 4 (Deload)", "reps": ["5", "5", "5"], "percentages": [0.40, 0.50, 0.60]}
    ]

    def __init__(self, 
                 squat: float = 100.0, 
                 bench: float = 100.0, 
                 deadlift: float = 100.0, 
                 press: float = 100.0,
                 active_lifts: Optional[List[str]] = None,
                 max_type: MaxType = MaxType.TRAINING_MAX,
                 tm_percentage: float = 90.0,
                 header_text: Optional[str] = None,
                 templates: Optional[List[Template]] = None,
                 fsl_params: Optional[dict] = None):
        
        self.header_text = header_text
        self.templates = templates or []
        self.active_lifts = active_lifts or ['squat', 'bench', 'deadlift', 'press']
        self.max_type = max_type
        self.tm_percentage = tm_percentage
        
        # Calculate training maxes
        all_maxes = {'squat': squat, 'bench': bench, 'deadlift': deadlift, 'press': press}
        self.maxes = self._calculate_training_maxes(
            {lift: all_maxes[lift] for lift in self.active_lifts}
        )
        
        # Validate templates
        self._validate_templates()
        
        # Process FSL params if needed
        if Template.FSL in self.templates:
            self.fsl_params = self._process_fsl_params(fsl_params)

    def _calculate_training_maxes(self, maxes: dict) -> dict:
        if self.max_type == MaxType.TRAINING_MAX:
            return maxes
        
        tm_percentage = self.tm_percentage or self._get_template_percentage()
        return {lift: max_value * (tm_percentage / 100) for lift, max_value in maxes.items()}

    def _get_template_percentage(self) -> float:
        if not self.templates:
            return 90.0
        selected_template = self.templates[0]
        return self.TEMPLATE_PERCENTAGES.get(selected_template, 90.0)

    def _validate_templates(self):
        mutually_exclusive_templates = {Template.FSL, Template.WIDOWMAKER, Template.PYRAMID}
        selected_exclusive_templates = [t for t in self.templates if t in mutually_exclusive_templates]
        if len(selected_exclusive_templates) > 1:
            raise ValueError(f"Templates {selected_exclusive_templates} are mutually exclusive. Only one can be selected.")

    def _process_fsl_params(self, fsl_params: Optional[dict]) -> Optional[dict]:
        if Template.FSL not in self.templates:
            return None

        if not fsl_params:
            raise ValueError("When FSL is selected, fsl_params must be provided.")

        sets = fsl_params.get('sets')
        reps = fsl_params.get('reps')

        if not (3 <= sets <= 8):
            raise ValueError("FSL sets must be between 3 and 8.")
        if not (3 <= reps <= 5):
            raise ValueError("FSL reps must be between 3 and 5.")

        return {'sets': sets, 'reps': reps}

    def _round_weight(self, weight: float) -> float:
        round_value = 2.5
        return round(weight / round_value) * round_value

    def generate(self) -> Dict:
        output = {
            "header_text": self.header_text,
            "training_maxes": self.maxes,
            "templates": [t.value for t in self.templates],
            "program": []
        }

        # Add accessory pairings
        output["accessory_pairings"] = {
            "Squat": "Chins",
            "OHP": "Dips",
            "Deadlift": "Rows"
        }

        for week in self.STRUCTURE_CORE:
            week_output = {
                "name": week['name'],
                "lifts": []
            }

            for lift, training_max in self.maxes.items():
                lift_output = {
                    "name": lift.title(),
                    "sets": []
                }

                for i, (percent, reps) in enumerate(zip(week['percentages'], week['reps'])):
                    weight = self._round_weight(training_max * percent)
                    lift_output["sets"].append({
                        "set_number": i + 1,
                        "reps": reps,
                        "weight": self._round_weight(weight),
                        "percentage": percent * 100
                    })

                if Template.FSL in self.templates and week["week"] != 4:
                    lift_output["fsl"] = {
                        "sets": self.fsl_params['sets'],
                        "reps": self.fsl_params['reps'],
                        "weight": self._round_weight(training_max * week['percentages'][0])
                    }
                elif Template.WIDOWMAKER in self.templates and week["week"] != 4:
                    lift_output["widowmaker"] = {
                        "weight": self._round_weight(training_max * week['percentages'][0])
                    }
                elif Template.PYRAMID in self.templates:
                    lift_output["pyramid"] = [
                        {
                            "reps": week['reps'][1],
                            "weight": self._round_weight(training_max * week['percentages'][1])
                        },
                        {
                            "reps": week['reps'][0] + "+",
                            "weight": self._round_weight(training_max * week['percentages'][0])
                        }
                    ]

                week_output["lifts"].append(lift_output)
            output["program"].append(week_output)

        return output

# HLM Classes
class HLMStandardGenerator:
    TEMPLATE_NAME = "HLM Standard 5s"
    ROUNDING_VALUE = 2.5

    def __init__(self, 
        squat: float = 100.0, 
        pull: float = 100.0, 
        press: float = 100.0,
        medium_reduction: float = 0.10,
        light_reduction: float = 0.20
        ):

        self.weights = {
            "squat": squat,
            "pull": pull,
            "press": press,
        }

        self.reductions = {
            "medium": medium_reduction,
            "light": light_reduction,
        }

        self.calculated_weights = {
            "heavy_squat": squat,
            "medium_squat": self.weights["squat"] * (1 - self.reductions["medium"]),
            "light_squat": self.weights["squat"] * (1 - self.reductions["light"]),
            "heavy_pull": pull,
            "medium_pull": self.weights["pull"] * (1 - self.reductions["medium"]),
            "light_pull": self.weights["pull"] * (1 - self.reductions["light"]),
            "heavy_press": press,
            "medium_press": self.weights["press"] * (1 - self.reductions["medium"]),
            "light_press": self.weights["press"] * (1 - self.reductions["light"]),
        }

        for key in self.calculated_weights:
            self.calculated_weights[key] = round(self.calculated_weights[key] / self.ROUNDING_VALUE) * self.ROUNDING_VALUE

        self.schedule = {
            "Mon": [
                f"Heavy Squat 1x1-5 - {self.calculated_weights['heavy_squat']} kg, 4x5 Backoff",
                f"Medium Press 4x5 - {self.calculated_weights['medium_press']} kg",
                f"Light Pull 3x3-5 - {self.calculated_weights['light_pull']} kg"
            ],
            "Wed": [
                f"Light Squat 3x5 - {self.calculated_weights['light_squat']} kg",
                f"Light Press 3x5 - {self.calculated_weights['light_press']} kg",
                f"Heavy Pull 2x1-5 - {self.calculated_weights['heavy_pull']} kg"
            ],
            "Fri": [
                f"Medium Squat 4x5 - {self.calculated_weights['medium_squat']} kg",
                f"Heavy Press 1x1-5 - {self.calculated_weights['heavy_press']} kg, 4x5 Backoff",
                f"Medium Pull 3x4-5 - {self.calculated_weights['medium_pull']} kg"
            ]
        }

    def generate(self) -> Dict:
        output = {
            "template_name": self.TEMPLATE_NAME,
            "weights": {exercise: weight for exercise, weight in self.weights.items()},
            "reductions": self.reductions,
            "schedule": self.schedule
        }
        return output

class HLMAlternatePressingGenerator:
    TEMPLATE_NAME = "HLM 5s (Alternate Pressing)"
    ROUNDING_VALUE = 2.5

    def __init__(self,
        heavy_squat_name: str = "Squat",
        squat: float = 100.0,
        primary_press: float = 100.0,
        primary_press_name: str = "OHP",
        secondary_press: Optional[float] = None,
        secondary_press_name: Optional[str] = None,
        pull: float = 100.0,
        heavy_pull_name: str = "Deadlift",
        medium_pull: Optional[float] = None,
        medium_pull_name: Optional[str] = None,
        light_pull: Optional[float] = None,
        light_pull_name: Optional[str] = None,
        medium_reduction: float = 0.10,
        light_reduction: float = 0.20,
        header_text: Optional[str] = None,
        ):

        self.header_text = header_text
        self.exercise_names = {
            "heavy_squat": heavy_squat_name,
            "primary_press": primary_press_name,
            "secondary_press": secondary_press_name,
            "heavy_pull": heavy_pull_name,
            "medium_pull": medium_pull_name,
            "light_pull": light_pull_name
        }

        self.weights = {
            "heavy_squat": squat,
            "primary_press": primary_press,
            "secondary_press": secondary_press,
            "heavy_pull": pull,
            "medium_pull": medium_pull,
            "light_pull": light_pull
        }

        self.reductions = {
            "medium": medium_reduction,
            "light": light_reduction,
        }

        self.calculated_weights = {
            "heavy_squat": self.weights['heavy_squat'],
            "medium_squat": self.weights["heavy_squat"] * (1 - self.reductions["medium"]),
            "light_squat": self.weights["heavy_squat"] * (1 - self.reductions["light"]),
            "heavy_press": self.weights['primary_press'],
            "medium_press": self.weights["primary_press"] * (1 - self.reductions["medium"]),
            "light_press": self.weights['secondary_press'] if self.weights['secondary_press'] else self.weights['primary_press'] * (1 - self.reductions["light"]),
            "heavy_pull": self.weights['heavy_pull'],
            "medium_pull": self.weights['medium_pull'] if self.weights['medium_pull'] else self.weights["heavy_pull"] * (1 - self.reductions["medium"]),
            "light_pull": self.weights['light_pull'] if self.weights['light_pull'] else self.weights["heavy_pull"] * (1 - self.reductions["light"]),
        }

        for key in self.calculated_weights:
            self.calculated_weights[key] = round(self.calculated_weights[key] / self.ROUNDING_VALUE) * self.ROUNDING_VALUE

        self.schedule = {
            "Mon": [
                f"Heavy Squat 1x1-5 - {self.calculated_weights['heavy_squat']} kg, 4x5 Backoff",
                f"Medium {self.exercise_names['primary_press']} 4x5 - {self.calculated_weights['medium_press']} kg",
                f"Light {self.exercise_names['light_pull']} 3x3-5 - {self.calculated_weights['light_pull']} kg" if self.weights['light_pull'] else
                    f"Light {self.exercise_names['heavy_pull']} 3x3-5 - {self.calculated_weights['light_pull']} kg"
            ],
            "Wed": [
                f"Light Squat 3x5 - {self.calculated_weights['light_squat']} kg",
                f"Heavy {self.exercise_names['secondary_press']} 1x5 - {self.calculated_weights['light_press']} kg, 4x5 Backoff" if self.weights['secondary_press'] else 
                    f"Light {self.exercise_names['primary_press']} 3x5 - {self.calculated_weights['light_press']} kg",
                f"Heavy {self.exercise_names['heavy_pull']} 2x1-5 - {self.calculated_weights['heavy_pull']} kg"
            ],
            "Fri": [
                f"Medium Squat 4x5 - {self.calculated_weights['medium_squat']} kg",
                f"Heavy {self.exercise_names['primary_press']} 1x1-5 - {self.calculated_weights['heavy_press']} kg, 4x5 Backoff",
                f"Medium {self.exercise_names['medium_pull']} 3x4-5 - {self.calculated_weights['medium_pull']} kg" if self.weights['medium_pull'] else
                    f"Medium {self.exercise_names['heavy_pull']} 3x4-5 - {self.calculated_weights['medium_pull']} kg"
            ]
        }

    def generate(self) -> Dict:
        output = {
            "template_name": self.TEMPLATE_NAME,
            "weights": {k: v for k, v in self.weights.items() if v is not None},
            "exercise_names": {k: v for k, v in self.exercise_names.items() if v is not None},
            "reductions": self.reductions,
            "header_text": self.header_text,
            "schedule": self.schedule
        }
        return output

# Existing 1RM functions
def calculate_1rm(weight: float, reps: int, formula: str) -> float:
    if reps == 1:
        return weight
    
    if formula.lower() == "epley":
        return weight * (1 + 0.033 * reps)
    elif formula.lower() == "brzycki":
        return weight * (36 / (37 - reps))
    elif formula.lower() == "lombardi":
        return weight * (reps ** 0.1)
    else:
        raise HTTPException(status_code=400, detail="Invalid formula. Use 'epley', 'brzycki', or 'lombardi'")

def calculate_weight_for_reps(one_rm: float, reps: int, formula: str) -> float:
    if reps == 1:
        return one_rm
    if formula.lower() == "epley":
        return one_rm / (1 + 0.033 * reps)
    elif formula.lower() == "brzycki":
        return one_rm * (37 - reps) / 36
    elif formula.lower() == "lombardi":
        return one_rm / (reps ** 0.1)
    else:
        raise HTTPException(status_code=400, detail="Invalid formula. Use 'epley', 'brzycki', or 'lombardi'")

def generate_rm_table(one_rm: float, input_reps: int, input_weight: float, formula: str) -> List[dict]:
    rep_targets = [1,2,3,4,5,6,7,8,9,10,13,16,20]
    table = []
    for reps in rep_targets:
        if reps == input_reps:
            is_input = True
        else:
            is_input = False
        weight = round(calculate_weight_for_reps(one_rm, reps, formula), 2)
        percent = round((weight / one_rm) * 100, 2)
        table.append({
            "reps": f"{reps}RM",
            "percentage": f"{percent}%",
            "weight": f"{weight:.2f}",
            "is_input": is_input
        })
    return table

# Existing endpoints
@app.post("/api/v1/calcs/1rm")
def calculate_one_rm(request: OneRMRequest):
    try:
        one_rm = calculate_1rm(request.weight, request.reps, request.formula)
        table = generate_rm_table(one_rm, request.reps, request.weight, request.formula)
        
        # Format the output
        output = "Reps    Percent Weight\n"
        output += "------------------------\n"
        for row in table:
            arrow = " <--" if row["is_input"] else ""
            output += f"{row['reps']:<7} {row['percentage']:<7} {row['weight']}{arrow}\n"
        
        return {"one_rm": round(one_rm, 2), "formatted_table": output}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New HLM endpoints
@app.post("/api/v1/programs/hlm/standard")
def generate_hlm_standard(request: HLMStandardRequest):
    try:
        generator = HLMStandardGenerator(
            squat=request.squat,
            pull=request.pull,
            press=request.press,
            medium_reduction=request.medium_reduction,
            light_reduction=request.light_reduction
        )
        return generator.generate()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/programs/hlm/alternate")
def generate_hlm_alternate(request: HLMAlternateRequest):
    try:
        generator = HLMAlternatePressingGenerator(
            heavy_squat_name=request.heavy_squat_name,
            squat=request.squat,
            primary_press=request.primary_press,
            primary_press_name=request.primary_press_name,
            secondary_press=request.secondary_press,
            secondary_press_name=request.secondary_press_name,
            pull=request.pull,
            heavy_pull_name=request.heavy_pull_name,
            medium_pull=request.medium_pull,
            medium_pull_name=request.medium_pull_name,
            light_pull=request.light_pull,
            light_pull_name=request.light_pull_name,
            medium_reduction=request.medium_reduction,
            light_reduction=request.light_reduction,
            header_text=request.header_text
        )
        return generator.generate()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New Wendler 5/3/1 endpoint
@app.post("/api/v1/programs/wendler531")
def generate_wendler531(request: Wendler531Request):
    try:
        generator = Wendler531Generator(
            squat=request.squat,
            bench=request.bench,
            deadlift=request.deadlift,
            press=request.press,
            active_lifts=request.active_lifts,
            max_type=request.max_type,
            tm_percentage=request.tm_percentage,
            header_text=request.header_text,
            templates=request.templates,
            fsl_params=request.fsl_params
        )
        return generator.generate()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/echo")
def echo_data(data: dict):
    return {"received_data": data}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)