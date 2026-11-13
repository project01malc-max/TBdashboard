# TB-07 Trend Analysis & Annual Dashboards (2023–2026)

Interactive web-based analytics and surveillance dashboards for the TB-07 programmatic data across all projects (2023–2026).

## Overview

- **Main Trend Dashboard (`Dashboard_Trend.html`)**: Multi-year consolidated performance overview, diagnostic cascade, HIV screening, drug susceptibility testing (DST), contact tracing, TPT initiation, and quarterly trend comparisons (2023–2026).
- **Annual Dashboards**: In-depth quarterly and regional breakdown dashboards for each specific reporting year:
  - `Web_Dashboard_2023 - corrected/`
  - `Web_Dashboard_2024 - corrected/`
  - `Web_Dashboard_2025 - corrected/`
  - `Web_Dashboard_2026 - corrected/`
- **Authentication (`login.html`)**: Portal gatekeeper with quick login authentication.

## Features & GitHub Pages Auto-Load

- **Instant Auto-Loading**: Each annual dashboard includes pre-bundled data (`data.js`) extracted directly from the verified TB-07 Excel workbooks. The dashboards open immediately on GitHub Pages without requiring users to attach or browse for `.xlsx` files.
- **Default View**: Automatically selects and displays the **All Project Total** (`ALL_PROJECT`) consolidated figures across all regions upon opening.
- **Interactive Facility / Regional Selection**: Users can seamlessly switch between facilities and regional sheets (`All Project Total`, `MPR`, `Karachi`, `Sindh`, `Gilgit-Baltistan`, `Azad Kashmir`, `KPK`) and quarters (`Q1`, `Q2`, `Q3`, `Q4`, `CONSOLIDATED`).
- **Dynamic File Upload Supported**: The drag-and-drop / file upload zone remains fully functional for uploading newer `.xlsx` versions anytime.
- **Updating Data**: To refresh pre-bundled data after modifying any of the Excel files, simply run:
  ```bash
  python generate_embedded_data.py
  ```

## How to Host on GitHub Pages

1. Create a new repository on GitHub and push these files.
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**.
5. Your dashboard will be live at `https://<username>.github.io/<repository-name>/`.
