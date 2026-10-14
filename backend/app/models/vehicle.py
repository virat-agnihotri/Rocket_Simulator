"""Vehicle Configuration Models."""
from pydantic import BaseModel, Field, field_validator


class VehicleConfig(BaseModel):
    """
    Hypothetical launch vehicle configuration in SI units.
    
    Attributes:
        dry_mass_kg: Structural/empty vehicle mass without payload or propellant (kg)
        payload_mass_kg: Mission payload mass (kg)
        propellant_mass_kg: Usable propellant mass (kg)
        thrust_n: Engine thrust force (N)
        specific_impulse_s: Engine specific impulse (s)
        drag_coefficient: Aerodynamic drag coefficient Cd (dimensionless)
        reference_area_m2: Aerodynamic cross-sectional reference area (m^2)
    """
    dry_mass_kg: float = Field(..., gt=0, description="Vehicle dry structural mass in kg")
    payload_mass_kg: float = Field(..., ge=0, description="Payload mass in kg")
    propellant_mass_kg: float = Field(..., gt=0, description="Propellant mass in kg")
    thrust_n: float = Field(..., gt=0, description="Engine thrust in Newtons")
    specific_impulse_s: float = Field(..., gt=0, description="Specific impulse in seconds")
    drag_coefficient: float = Field(default=0.3, ge=0.0, le=5.0, description="Aerodynamic drag coefficient Cd")
    reference_area_m2: float = Field(default=10.0, gt=0, description="Aerodynamic reference area in m^2")

    @property
    def burnout_mass_kg(self) -> float:
        """Vehicle mass after total propellant exhaustion (dry + payload)."""
        return self.dry_mass_kg + self.payload_mass_kg

    @property
    def initial_total_mass_kg(self) -> float:
        """Total liftoff mass (dry + payload + propellant)."""
        return self.burnout_mass_kg + self.propellant_mass_kg

    @field_validator("propellant_mass_kg")
    @classmethod
    def validate_propellant(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Propellant mass must be strictly positive.")
        return v
