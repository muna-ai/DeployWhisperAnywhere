# Deploy Whisper Anywhere
Example code for our tutorial on [Deploying Whisper Anywhere with Muna]()

The tutorial is available at XXXX

## Running this Code

### Clone the Repository


The first step is to clone this repo locally on you development machine:
```bash
git clone git@github.com:muna-ai/DeployWhisperAnywhere.git
cd DeployWhisperAnywhere
```


### Running Part 1

Part 1 of this tutorial describes how to implement a Whisper model in
Python. You can run that code by performing the following commands

```bash
cd Part_1
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python whisper.py
```

### Running Part 2

Part 2 of this tutorial describes how to compile your Whisper model with
Muna.  You can run the code in Part 2 as just regular Python code like this:

```bash
cd Part_2
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python whisper_muna.py
```

Please see [the tutorial]() for more details.

### Running Part 3

For details on running Part 3 of this tutorial, please see the [Part_3/README.md](/Part_3/README.md).

## Support

For questions and support, visit the Muna team on [our Slack community](https://muna.ai/slack).
