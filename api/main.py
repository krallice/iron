from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from typing import Dict, List, Optional
from pydantic import BaseModel

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
@app.post("/calc/1rm")
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
@app.post("/hlm/standard")
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

@app.post("/hlm/alternate")
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

@app.post("/echo/")
def echo_data(data: dict):
    return {"received_data": data}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)