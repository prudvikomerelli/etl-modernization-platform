# ETL Modernization Platform — Demo Video Script
**Duration:** 75 seconds (target: 60-90s)  
**Format:** Screen recording with voiceover narration  
**Resolution:** 1920×1080 (16:9)  
**Date:** 2026-04-04  

---

## Pre-Recording Setup
1. Open the app at `localhost:3000` (or deployed URL)
2. Make sure you're logged in
3. Delete any test projects so the dashboard looks clean (or keep 1-2 for context)
4. Have your Informatica XML file ready on the desktop
5. Use a screen recorder (OBS, Loom, or QuickTime)
6. Speak slowly and clearly — aim for ~130 words/minute

---

## 🎬 STORYBOARD

### Scene 1: Hook & Dashboard (0:00 – 0:12)
**Screen:** Dashboard page (`/app`)  
**Action:** Show the dashboard with stats cards and project list

**Narration:**
> "Meet the ETL Modernization Platform — your AI-powered bridge from legacy ETL tools to modern cloud-native pipelines. From the dashboard, you can manage all your migration projects, track conversion status, and monitor progress at a glance."

**Mouse:** Hover over the stats cards (Projects, Conversions, Plan), then the project list.

---

### Scene 2: Create a New Project (0:12 – 0:25)
**Screen:** Click "New Conversion" button → New Conversion page (`/app/new`)  
**Action:** Fill in the form step by step

**Narration:**
> "Starting a new migration takes seconds. Name your project, upload your legacy XML export — here's an Informatica PowerCenter file — and select your target platform. We support Airflow, Azure Data Factory, Databricks, and more."

**Mouse:**  
1. Type project name: `"Sales Pipeline Migration"`
2. Drag-and-drop the XML file (or click browse)
3. Click "Azure Data Factory" as target
4. Click **"Start Conversion"**

---

### Scene 3: AI Processing (0:25 – 0:32)
**Screen:** Brief loading state as the app processes  
**Action:** Show the "Processing…" button state

**Narration:**
> "Behind the scenes, our AI engine detects the source tool, parses the XML metadata, and extracts every source, target, mapping, and transformation — automatically."

**Mouse:** Wait for the redirect to Parse page.

---

### Scene 4: Parse Metadata Explorer (0:32 – 0:48)
**Screen:** Parse Metadata page (`/app/project/[id]/parse`)  
**Action:** Scroll through the extracted metadata

**Narration:**
> "The Parse Metadata explorer gives you a complete X-ray of your legacy pipeline. Sources and targets with full schemas, mappings with field-level lineage, transformations with support status, and workflow orchestration details. Everything extracted with high fidelity."

**Mouse:**  
1. Point at the summary cards (Sources, Targets, Mappings, Transforms, etc.)
2. Scroll down to show Mappings with field-level detail
3. Briefly show Transformations table
4. Scroll to Workflows section
5. Click **"Continue to Convert →"**

---

### Scene 5: Convert to Target Platform (0:48 – 1:05)
**Screen:** Convert page (`/app/project/[id]/convert`)  
**Action:** Run the conversion

**Narration:**
> "Now for the magic. Select your target platform — Azure Data Factory — and click Convert. The engine normalizes your metadata into a canonical model, then generates production-ready ADF pipeline configurations with proper error handling, parameterization, and best practices baked in."

**Mouse:**  
1. Show "Azure Data Factory" pre-selected (from project setup)
2. Click **"Convert to Azure Data Factory"**
3. Wait for results
4. Point at the success banner and coverage score
5. Click "Preview generated output" to expand the code preview
6. Click **"Export JSON"** to download

---

### Scene 6: Project Overview & History (1:05 – 1:15)
**Screen:** Navigate to Project page (`/app/project/[id]`)  
**Action:** Show the project overview

**Narration:**
> "Back on the project page, you can track every step of your migration. The Conversion Timeline shows execution history with timing, and the Conversion History preserves every run so you can compare outputs across platforms."

**Mouse:**  
1. Show the Workflow stepper (all green checkmarks)
2. Scroll to Conversion Timeline
3. Scroll to Conversion History section

---

### Scene 7: Closing CTA (1:15 – 1:18)
**Screen:** Dashboard or landing page  
**Action:** Quick return to dashboard

**Narration:**
> "ETL Modernization Platform — migrate smarter, not harder."

---

## 📝 RECORDING TIPS

### Pacing
| Scene | Duration | Words | Key Action |
|-------|----------|-------|------------|
| 1. Dashboard | 12s | ~26 | Show overview |
| 2. New Project | 13s | ~38 | Create project + upload |
| 3. Processing | 7s | ~22 | AI loading |
| 4. Parse Metadata | 16s | ~40 | Scroll through results |
| 5. Convert | 17s | ~45 | Convert + preview + export |
| 6. History | 10s | ~30 | Show timeline + history |
| 7. Closing | 3s | ~7 | Tagline |
| **Total** | **~78s** | **~208** | |

### Production Tips
- **Cursor:** Use a large, visible cursor (yellow circle highlight recommended)
- **Speed:** Move the mouse deliberately — don't rush between clicks
- **Pauses:** Pause 0.5s on each section before moving on
- **Clean up:** Close any browser dev tools, notifications, bookmarks bar
- **Browser:** Use Chrome in full-screen, with a clean profile (no extensions showing)
- **Zoom:** Browser zoom at 110% makes text more readable on video
- **Audio:** Record narration separately for better quality, then sync in editing

### Editing Suggestions
- Add subtle transition effects between scenes (cross-dissolve)
- Include a title card at 0:00 before the dashboard: "ETL Modernization Platform"
- Add a closing card with website URL and call-to-action
- Background music: soft, upbeat tech/corporate track at ~20% volume
- Consider adding zoom-in effects when pointing at specific data sections

### Tools for Recording
- **Screen:** OBS Studio (free), Loom, or QuickTime (macOS)
- **Editing:** DaVinci Resolve (free), iMovie, or Descript
- **Voiceover:** Record in a quiet room, use a USB mic if available
- **Cursor highlight:** Keycastr (macOS) or Mouse Pointer Highlighter (Windows)
