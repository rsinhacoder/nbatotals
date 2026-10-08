# NBA Quant Over/Under Regulation Forecasting Platform

A high-performance quantitative sports analytics web platform built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Recharts**, translating the empirical NBA Over/Under lowest-quarter regression model into an interactive application.

---

## 🏀 5-Year Trained Model (2020-21 to 2024-25)

The model has been trained via Ordinary Least Squares (OLS) regression on **6,000 completed NBA regular-season games** across the past 5 consecutive NBA seasons:

- **Main Regression Equation (5-Year Trained)**:
  $$\text{Predicted Regulation Total} = 119.5598 + 2.3621 \times \text{Lowest Regulation Quarter}$$
- **Other Three Quarters Model**:
  $$\text{Predicted Other 3 Quarters} = 119.5598 + 1.3621 \times \text{Lowest Regulation Quarter}$$
- **Statistical Fit (5 Years, N = 6,000)**:
  - $R^2$: `0.4650`
  - 5-Year MAE: `9.77` points (reduced from 10.16)
  - 5-Year RMSE: `12.22` points
  - Hit Rate within $\pm 10$ pts: `58.22%`
  - Hit Rate within $\pm 15$ pts: `77.95%`
  - Under 219 Ratio ($<47 : \ge 47$): `10.26 : 1`

### Comparison: 5-Year Model vs. Original 2-Year Model
| Metric | 5-Year Trained (2020-2025) | Original 2-Year (2023-2025) | Delta |
| :--- | :---: | :---: | :---: |
| **Sample Size (N)** | **6,000 Games** | 2,460 Games | +3,540 games |
| **Model Intercept ($\beta_0$)** | **119.5598** | 114.7597 | +4.8001 |
| **Model Slope ($\beta_1$)** | **2.3621** | 2.3274 | +0.0347 (+1.4%) |
| **Mean Absolute Error (MAE)** | **9.77 pts** | 10.16 pts | **-0.39 pts (More Accurate)** |
| **$R^2$ Correlation** | **0.4650** | 0.4410 | +0.0240 |

---

## 🌟 Key Application Features

1. **Upcoming Matches & Live In-Play Slate**:
   - Matchup cards with ESPN logos, records, and team pace/defense ratings.
   - Live in-play quarter capping.
   - Sportsbook consensus line comparison with quantitative edge callouts (`STRONG UNDER`, `LEAN UNDER`, etc.).
   - Interactive slider override on every matchup card.
   - One-click transfer to In-Game Simulator.

2. **5-Year Model Training & Calibration**:
   - Inspect 5-year OLS regression metrics and season-by-season stability breakdown (2020-21 through 2024-25).
   - Instant toggle between **5-Year Trained Model**, **Original 2-Year Model**, or **Custom User Calibration**.
   - Side-by-side regression slope comparison chart.

3. **Executive Quant Dashboard**:
   - Real-time KPI summary: Success Rate, MAE, RMSE, $R^2$, Accuracy hit rates ($\pm5$, $\pm10$, $\pm15$).
   - Interactive Regression Scatter plot with model line and threshold guides ($47$ & $219$).

4. **Forecast Evaluation & All Games Explorer**:
   - Search, multi-parameter filtering, and inline editable sportsbook reference lines.
   - Expandable rows for 4-quarter breakdowns and ESPN links.

5. **In-Game / Pre-Game Live Simulator ("What-If" Calculator)**:
   - Slider and 4-quarter inputs for real-time projection during live games or pre-game modeling.

6. **Bucket Stability & Under 219 Contingency Matrix**:
   - 8 discrete scoring brackets (`≤35` through `54+`).
   - 2x2 regime matrix quantifying the $10.26 : 1$ conditional probability multiplier.

7. **Multi-Sheet Excel & CSV Export**:
   - Generates the exact 7-sheet `NBA_Current_Season_Forecast.xlsx` workbook.

---

## 🚀 Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Re-Train 5-Year Model Script (Python)
```bash
python train_5_years.py
```
This script computes OLS regression across the 5 seasons, prints statistics, and writes results to `trained_5_years_model.json`.
