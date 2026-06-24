# Installation Guide - ResilientX RAG Pipeline

## 📋 Prerequisites

### Required
- **Python 3.9+** (recommended: Python 3.10 or 3.11)
- **pip** (Python package manager)
- **8GB+ RAM** (16GB recommended)
- **5GB+ free disk space**

### Optional
- **Tesseract OCR** (for OCR functionality)
- **Google Cloud credentials** (for Google Drive integration)
- **API keys** (IMF, World Bank, EIA, Ember)

## 🚀 Quick Installation (Recommended)

### Linux / macOS

```bash
# 1. Navigate to project directory
cd rag_pipeline

# 2. Run installation script
chmod +x install.sh
./install.sh

# 3. Follow the prompts
# Select option 1 for full installation
```

### Windows

```batch
# 1. Navigate to project directory
cd rag_pipeline

# 2. Run installation script
install.bat

# 3. Follow the prompts
```

## 📦 Manual Installation

### Step 1: Create Virtual Environment (Recommended)

```bash
# Linux/macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 2: Install Dependencies

**Option A: Full Installation (All Features)**
```bash
pip install -r requirements.txt
```

**Option B: Minimal Installation (Core Only)**
```bash
pip install -r requirements-minimal.txt
```

**Option C: Custom Installation**
```bash
# Core components (always required)
pip install -r requirements-minimal.txt

# Add components as needed:

# Full PDF support
pip install pdfplumber PyPDF2

# OCR support
pip install easyocr pytesseract Pillow pdf2image

# Excel file support
pip install openpyxl pyxlsb

# News scraping
pip install newspaper3k lxml nltk

# Google Drive integration
pip install google-auth google-auth-oauthlib google-api-python-client

# Streamlit dashboard
pip install streamlit plotly matplotlib seaborn

# API clients
pip install wbdata pandas-datareader
```

### Step 3: Install Ollama

**Linux / macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
1. Download from https://ollama.ai/download/windows
2. Run the installer
3. Restart your terminal

### Step 4: Pull DeepSeek-R1 Model

```bash
# Start Ollama server (in a separate terminal)
ollama serve

# Pull the model
ollama pull deepseek-r1:8b
```

### Step 5: Setup Environment

```bash
# Copy environment template
cp .env.template .env

# Edit .env and add your API keys (optional)
nano .env  # or use any text editor
```

### Step 6: Create Directories

```bash
mkdir -p data logs cache vector_db temp
```

### Step 7: Verify Installation

```bash
python setup_verification.py
```

## 🔧 Component-Specific Setup

### Tesseract OCR (Optional)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
1. Download from https://github.com/UB-Mannheim/tesseract/wiki
2. Install and add to PATH
3. Set path in code: `pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'`

### Google Drive Integration (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Download `credentials.json`
6. Place in project root directory

### API Keys (Optional)

Edit `.env` file:

```bash
# IMF Data API
IMF_API_KEY=your_key_here

# World Bank API (usually no key needed)
WORLD_BANK_API_KEY=your_key_here

# EIA API
EIA_API_KEY=your_key_here

# Ember Climate API
EMBER_API_KEY=your_key_here
```

**Getting API Keys:**

- **IMF**: https://data.imf.org/
- **World Bank**: Usually works without key
- **EIA**: https://www.eia.gov/opendata/register.php
- **Ember**: https://ember-climate.org/data/

## 🧪 Testing Installation

### Quick Test

```bash
python -c "from rag_pipeline import RAGPipeline; print('✓ Import successful')"
```

### Full Verification

```bash
python setup_verification.py
```

Expected output:
```
✓ All dependencies installed
✓ Ollama server is running
✓ DeepSeek-R1 model found
✓ All imports successful
✓ Embedding model loaded
✓ ALL TESTS PASSED
```

### Run Examples

```bash
python examples.py
# Select option 6 for full workflow
```

## 🐛 Troubleshooting

### Python Version Issues

```bash
# Check Python version
python --version
python3 --version

# Use specific version
python3.10 -m venv venv
```

### pip Issues

```bash
# Upgrade pip
pip install --upgrade pip

# Use pip3
pip3 install -r requirements.txt
```

### Ollama Issues

**"Connection refused"**
```bash
# Start Ollama server
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

**"Model not found"**
```bash
# List models
ollama list

# Pull model
ollama pull deepseek-r1:8b
```

### FAISS Installation Issues

**On macOS with M1/M2:**
```bash
pip install faiss-cpu --no-cache-dir
```

**On Windows:**
```bash
# Use conda instead
conda install -c pytorch faiss-cpu
```

### OCR Issues

**EasyOCR download fails:**
```bash
# Set offline mode
export EASYOCR_MODULE_PATH=/path/to/models

# Or use pytesseract instead
```

### Memory Issues

```bash
# Reduce batch size in config.py
config.embedding.batch_size = 8
config.chunking.chunk_size = 256
```

### Import Errors

```bash
# Install missing package
pip install package_name

# Reinstall all
pip install -r requirements.txt --force-reinstall
```

## 📊 Installation Verification Checklist

- [ ] Python 3.9+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Ollama installed
- [ ] DeepSeek-R1 model downloaded
- [ ] Directories created
- [ ] .env file created
- [ ] Verification script passed
- [ ] Examples run successfully

## 💻 Platform-Specific Notes

### Linux
- ✅ Best compatibility
- ✅ All features work out of box
- Recommended: Ubuntu 22.04 or newer

### macOS
- ✅ Good compatibility
- ⚠ M1/M2: Use native Python, not Rosetta
- Install via Homebrew for easier setup

### Windows
- ✅ Works with some setup
- ⚠ Ollama requires Windows 10+
- ⚠ Some paths may need adjustment
- Use WSL2 for best experience

## 🔄 Updating

```bash
# Update dependencies
pip install -r requirements.txt --upgrade

# Update Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Update DeepSeek model
ollama pull deepseek-r1:8b
```

## 📚 Next Steps

After installation:

1. **Test basic functionality:**
   ```bash
   python examples.py  # Select option 1
   ```

2. **Build knowledge base:**
   ```bash
   python examples.py  # Select option 6
   ```

3. **Launch dashboard:**
   ```bash
   streamlit run streamlit_app.py
   ```

4. **Read documentation:**
   - `README.md` - Full documentation
   - `QUICKSTART.md` - Quick reference
   - `PROJECT_SUMMARY.md` - Overview

## 🆘 Getting Help

If you encounter issues:

1. Check `logs/` directory for error messages
2. Run `python setup_verification.py` for diagnostics
3. Review this installation guide
4. Check specific component documentation

## ⚙️ Advanced Configuration

### Custom Model Paths

Edit `config.py`:
```python
config.embedding.model_name = "your/custom/model"
config.llm.model_name = "your-llm-model"
```

### Custom Storage Locations

```python
config.vector_db.persist_directory = "/custom/path"
config.cache_dir = "/custom/cache"
```

### Performance Tuning

```python
# For faster processing
config.embedding.batch_size = 64
config.chunking.chunk_size = 256

# For better quality
config.chunking.chunk_size = 1024
config.search.top_k = 10
```

---

**Installation complete! You're ready to use the RAG pipeline! 🚀**
