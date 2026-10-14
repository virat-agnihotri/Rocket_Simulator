"""SQLAlchemy Database Models for Mission and Simulation Persistence."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class MissionDB(Base):
    """Persisted mission profile containing vehicle and mission configuration."""
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Vehicle Parameters
    dry_mass_kg = Column(Float, nullable=False)
    payload_mass_kg = Column(Float, nullable=False)
    propellant_mass_kg = Column(Float, nullable=False)
    thrust_n = Column(Float, nullable=False)
    specific_impulse_s = Column(Float, nullable=False)
    drag_coefficient = Column(Float, default=0.3)
    reference_area_m2 = Column(Float, default=10.0)

    # Mission Parameters
    target_altitude_m = Column(Float, default=400000.0)
    launch_altitude_m = Column(Float, default=0.0)
    simulation_duration_s = Column(Float, default=1200.0)
    atmosphere_model = Column(String(32), default="exponential")
    wind_velocity_x_mps = Column(Float, default=0.0)

    # Guidance Parameters
    pitchover_altitude_m = Column(Float, default=500.0)
    pitch_end_altitude_m = Column(Float, default=80000.0)
    target_pitch_deg = Column(Float, default=85.0)
    pitch_exponent = Column(Float, default=0.5)

    simulations = relationship("SimulationRecordDB", back_populates="mission", cascade="all, delete-orphan")


class SimulationRecordDB(Base):
    """Persisted simulation run result and telemetry summary."""
    __tablename__ = "simulations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mission_id = Column(String(36), ForeignKey("missions.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    status = Column(String(32), nullable=False)
    termination_reason = Column(Text, nullable=False)
    peak_altitude_m = Column(Float, nullable=False)
    peak_speed_mps = Column(Float, nullable=False)
    peak_acceleration_mps2 = Column(Float, nullable=False)
    max_q_pa = Column(Float, nullable=False)
    total_flight_time_s = Column(Float, nullable=False)
    burn_duration_s = Column(Float, nullable=False)
    ideal_delta_v_mps = Column(Float, nullable=False)
    orbit_classification = Column(String(32), nullable=False)
    target_orbit_satisfied = Column(Boolean, default=False)

    summary_json = Column(Text, nullable=False)
    telemetry_json = Column(Text, nullable=True)

    mission = relationship("MissionDB", back_populates="simulations")
