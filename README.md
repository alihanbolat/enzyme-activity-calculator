# Enzyme Activity Calculator

A web application for measuring enzyme activity through CSV data analysis, visualization, linear regression, and UV-Vis spectroscopy calculations.

## 🚀 New to Deployment?

**Just deployed to Netlify?** Check out these quick guides:
- 📖 **[QUICK_START.md](QUICK_START.md)** - Fast deployment guide (2 minutes)
- 🔍 **[NETLIFY_REVIEW.md](NETLIFY_REVIEW.md)** - Comprehensive review & recommendations
- 📋 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions

## Features

- **CSV File Upload**: Upload CSV files with x and y columns
- **Data Visualization**: Interactive line chart displaying your data points
- **Automatic Linear Region Detection**: Intelligently identifies the most linear portion of your data, excluding lag phases and saturation effects
- **Linear Regression Analysis**: Automatically calculates:
  - Slope (m) - crucial for enzyme activity measurements
  - Intercept (b)
  - R² value (goodness of fit)
  - Regression equation
  - Linear region range (X values)
- **Enzyme Activity Calculation**: Calculate enzyme activity from slope using UV-Vis spectroscopy parameters
- **Clean UI**: Modern, responsive interface

## How to Use

### Step 1: Analyze Your Data

1. Open `index.html` in your web browser
2. Click "Choose CSV File" and select your CSV file
3. Your CSV should have two columns (x and y values), with or without headers
4. Click "Analyze Data" to process the file
5. View the results:
   - Interactive chart with data points and regression line
   - Gray points: Excluded from calculation (lag/saturation phases)
   - Blue points: Linear region used for slope calculation
   - Slope value and statistical measures

### Step 2: Calculate Enzyme Activity

1. After analyzing your data, scroll to the "Enzyme Activity Calculation" section
2. Enter or adjust the following parameters:
   - **Volume (Sample)**: Default 0.02 ml
   - **Volume (Assay)**: Default 1 ml
   - **Dilution Factor**: Default 1
3. Fixed parameters (built-in):
   - Extinction Coefficient (ε): 0.02 mM⁻¹cm⁻¹
   - Cuvette Diameter: 1 cm
4. Click "Calculate Enzyme Activity"
5. View your enzyme activity result in U/ml

## CSV Format

Your CSV file should be formatted like this:

```csv
x,y
0.5,0.12
1.0,0.24
1.5,0.36
2.0,0.48
2.5,0.60
```

Or without headers:

```csv
0.5,0.12
1.0,0.24
1.5,0.36
2.0,0.48
2.5,0.60
```

## Calculation Formula

The enzyme activity is calculated using:

```
Activity (U/ml) = ((-slope / (ε × l)) / 1000) × (V_assay / V_sample) × Dilution
```

Where:
- **slope**: From linear regression of the linear region
- **ε**: Extinction coefficient (0.02 mM⁻¹cm⁻¹)
- **l**: Cuvette diameter (1 cm)
- **V_assay**: Volume of assay mixture
- **V_sample**: Volume of sample
- **Dilution**: Dilution factor

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js (for data visualization)

## Example Data Files

- `sample_enzyme_data.csv`: Sample data with typical enzyme kinetics
- `test_with_nonlinear.csv`: Data with clear lag and saturation phases for testing

## Installation

No installation required! Simply open `index.html` in any modern web browser.

## Tips

- The app automatically detects the most linear region of your data
- Check the browser console (F12) for detailed information about which data points were selected
- The "Linear Region (X Range)" shows exactly which x-values were used for the slope calculation
- Adjust the Volume and Dilution parameters to match your experimental setup
