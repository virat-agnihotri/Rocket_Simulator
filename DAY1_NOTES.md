# Day 1: Fundamental Rocket Physics Calculator

## Simple Explanation of the Equations

When you build a rocket, you are essentially throwing mass out the back to push the rocket forward. Three fundamental concepts help us understand how well a rocket will perform:

### 1. Thrust-to-Weight Ratio (TWR)
**Equation:** `TWR = Thrust / (Initial Mass × g0)`
*   **What it means:** This compares the raw pushing power (thrust) of the engines against the downward pull of Earth's gravity (weight) on the fully loaded rocket.
*   **Why it matters:** If the TWR is greater than 1, the rocket pushes up harder than gravity pulls down, allowing it to lift off the ground.
*   **Limitation:** A TWR > 1 indicates positive initial vertical acceleration only for a stationary rocket under simplified assumptions (thrust acts exactly vertically and we ignore things like air resistance). `g0` (9.80665 m/s²) is standard gravity.

### 2. Ideal Delta-v (The Rocket Equation)
**Equation:** `Delta-v = Isp × g0 × ln(Initial Mass / Final Mass)`
*   **What it means:** Delta-v (change in velocity) is the ultimate measure of a rocket's capability—how much it can change its speed in space. It depends on engine efficiency (Specific Impulse or `Isp`) and how much of the rocket is fuel versus empty weight (the natural log `ln` of the mass ratio).
*   **Why it matters:** Different missions require different amounts of delta-v. Reaching orbit requires a lot of it!
*   **Limitations:** This is the *ideal* rocket equation. It assumes idealized propulsion and does not account for gravity dragging the rocket down (gravity losses), air resistance (atmospheric drag), or energy lost to steering (steering losses).

### 3. Propellant Mass
**Equation:** `Propellant mass = Initial mass - Final mass`
*   **What it means:** This is the amount of fuel and oxidizer the rocket burns. The initial and final masses refer to the same vehicle configuration before and after propellant consumption. The final mass includes the empty rocket structure (dry mass) and the payload.

---

## Manual Test Examples

You can use these examples to test if the program works correctly.

### Test 1: Successful Launch (High TWR)
*   **Initial mass:** 500000 kg
*   **Final mass:** 50000 kg
*   **Engine thrust:** 7000000 N
*   **Specific impulse (Isp):** 300 s
*   **Expected Results:**
    *   Propellant mass: 450,000 kg
    *   Thrust-to-weight ratio: ~1.43
    *   Ideal delta-v: ~6774 m/s (6.77 km/s)

### Test 2: Low Thrust (Cannot lift off Earth)
*   **Initial mass:** 500000 kg
*   **Final mass:** 50000 kg
*   **Engine thrust:** 4000000 N
*   **Specific impulse (Isp):** 300 s
*   **Expected Results:**
    *   Propellant mass: 450,000 kg
    *   Thrust-to-weight ratio: ~0.82 (Less than 1, so it cannot lift off on Earth)
    *   Ideal delta-v: ~6774 m/s (6.77 km/s)

### Test 3: Invalid Input (Final mass > Initial mass)
*   **Initial mass:** 50000
*   **Final mass:** 60000
*   **Engine thrust:** 100000
*   **Specific impulse:** 300
*   **Expected Result:** An error message: `Error: Final mass cannot exceed initial mass.`

### Test 4: Non-numerical Input
*   **Initial mass:** abc
*   **Expected Result:** An error message: `Error: Please enter valid numerical values.`
