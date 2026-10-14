"""Physical Constants in SI Units."""

# Universal Gravitational Constant [m^3 / (kg * s^2)]
G: float = 6.67430e-11

# Earth Physical Constants (WGS 84 / IUGG standard values)
EARTH_MASS_KG: float = 5.9722e24
EARTH_MU: float = 3.986004418e14  # Standard gravitational parameter GM [m^3 / s^2]
EARTH_RADIUS_M: float = 6371000.0  # Mean volumetric radius [m]
STANDARD_GRAVITY_G0: float = 9.80665  # Standard sea-level acceleration [m / s^2]
EARTH_ROTATION_RATE_RAD_S: float = 7.2921159e-5  # Sidereal rotation rate [rad / s]

# Atmosphere Reference Constants
SEA_LEVEL_DENSITY_RHO0: float = 1.225  # Standard sea-level density [kg / m^3]
ATMOSPHERE_SCALE_HEIGHT_M: float = 8500.0  # Troposphere/stratosphere effective scale height [m]
SEA_LEVEL_PRESSURE_P0: float = 101325.0  # Sea-level atmospheric pressure [Pa]
SEA_LEVEL_TEMPERATURE_T0: float = 288.15  # Sea-level temperature [K]
SPECIFIC_GAS_CONSTANT_AIR: float = 287.05  # R_specific for dry air [J / (kg * K)]
ADIABATIC_INDEX_AIR_GAMMA: float = 1.4  # Specific heat ratio cp / cv
KARMAN_LINE_ALTITUDE_M: float = 100000.0  # Boundary of space [m]
MAX_ATMOSPHERE_ALTITUDE_M: float = 150000.0  # Beyond this, aerodynamic effects are negligible [m]
