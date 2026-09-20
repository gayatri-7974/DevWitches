# Bhoomi Setu 🌾 – AI-Powered Land Governance on AWS

> **Know the reality of your land, not just the record of it.**

**Team DevWitches**

| | |
|---|---|
| 🌐 **Live demo** | _<https://main.dpwpht3t5ohdc.amplifyapp.com/>_ |
| 🎥 **Demo video** | _<https://drive.google.com/file/d/1uvF6aEUOX7pOKWtwsN2ZPXVSDzHorhgQ/view?usp=sharing>_ |

---

## Why We Built This

This problem is personal.

My grandfather worked for years to save up and buy a piece of land. Some years later he discovered that the details on his land documents had been changed. Fixing it was slow, painful, and stressful, and it showed us how fragile land records are when they can be altered without the owner knowing.

There is a second, quieter problem too. If someone occupies or builds on your land, **you often don't find out until the government runs a survey**, which can be years later. By then, the encroachment is established and hard to undo.

## 🎯 The Problem

Existing digital land portals, such as Meebhoomi, are useful for looking up records. But in our experience they are slow and painful to use, and they stop at showing records. They don't answer the question landowners care about most:

**"Is my land still mine, right now?"**

- ❌ No automated way to detect encroachment between government surveys
- ❌ Slow, hard-to-use record lookup
- ❌ Records can be changed without the owner's involvement

## 💡 Our Solution

Bhoomi Setu asks a different question: **how can AWS make an existing solution better?**

We take the parcel records people already rely on and add cloud-scale intelligence:

- 🗺️ **Satellite parcel map**: every parcel drawn on real satellite imagery
- 📄 **Instant deed access**: click any parcel and open its deed PDF
- 🤖 **AI encroachment scan**: one click compares "before" and "after" satellite imagery and tells you whether a new structure, compound wall, shed, or fence has appeared
- 👥 **Two portals**: Citizen and Government Officer views

The AI scan turns a survey that takes months into a result in seconds.

## 🔍 How the AI Scan Works

1. The user clicks a parcel and presses **Run AI encroachment scan**.
2. The frontend sends the parcel's ULPIN to an AWS Lambda function.
3. Lambda loads the parcel's baseline (`before`) and recent (`after`) satellite images from Amazon S3.
4. Both images are sent to **Claude Sonnet 4.5 on Amazon Bedrock** with a cadastral-surveyor prompt.
5. The model returns structured JSON, which the app displays:

```json
{
  "encroachment_detected": true,
  "confidence": "HIGH",
  "summary": "A new compound wall has appeared along the northern boundary."
}
```

## 🏗️ Architecture

```
                 ┌────────────────────────────┐
                 │  React + Leaflet frontend  │
                 │    hosted on AWS Amplify   │
                 └──────┬───────────────┬─────┘
                        │               │
              Deed PDF  │               │  AI scan request (ULPIN)
                        ▼               ▼
              ┌──────────────┐   ┌─────────────────────┐
              │  Amazon S3   │   │  AWS Lambda         │
              │  deeds_docs/ │   │  (Function URL)     │
              └──────────────┘   └───────┬───────┬─────┘
                                         │       │
                       before / after    │       │  vision analysis
                       satellite images  ▼       ▼
                                 ┌──────────┐ ┌──────────────────────┐
                                 │ Amazon S3│ │ Amazon Bedrock       │
                                 │ imagery  │ │ Claude Sonnet 4.5    │
                                 └──────────┘ └──────────────────────┘

   Parcel records ──► Amazon DynamoDB (LandParcels) ──► served by Lambda
```

## ☁️ AWS Services Used

| Service | How we use it |
|---|---|
| **Amazon Bedrock** (Claude Sonnet 4.5) | Vision model that compares before/after satellite imagery and detects encroachment |
| **AWS Lambda** | Serverless backend for everything: AI scan, parcel data APIs, and imagery handling, exposed through Function URLs |
| **Amazon S3** | Stores satellite imagery and deed PDFs |
| **Amazon DynamoDB** | Stores parcel records: owner, area, land type, status, and geometry |
| **AWS Amplify** | Hosts the React frontend |

Everything is serverless, so it scales to zero cost when idle and can scale to millions of parcels without managing servers.

## 🧰 Tech Stack

React · Vite · Leaflet / react-leaflet · Esri satellite tiles · Python (boto3) · AWS

## 📊 About Our Data

**All data in this project was created by our team.** We did not use real government records. The parcels, owners, deeds, and satellite images are synthetic, but designed to mimic the structure and behavior of real land-record data so the system can be demonstrated end to end.

Demo parcels use ULPINs `28065010041001` to `28065010041006`. Parcel `28065010041002` is flagged and shows a visible encroachment in its imagery.

## 📁 Project Structure

```
DevWitches/
├── backend/     Lambda functions and DynamoDB seed data
└── frontend/    React app (Vite)
```

## On Amplify.

## 🔭 Future Development

- 🛰️ **Live satellite feeds**: connect to satellite imagery APIs, such as ISRO and other providers, so scans use fresh imagery automatically instead of prepared images
- 📲 **Instant SMS alerts and complaint logging**: using Amazon SNS, when an AI scan confirms encroachment, an SMS alert goes out at once to both the landowner and the responsible government official. The scan result is stored with a timestamp as a record, which makes complaint logging easier and gives both sides evidence to work from in any legal dispute
- ⏱️ **Automated monitoring**: scheduled scans of every parcel, with instant alerts to landowners and officers when change is detected
- 🔐 **Tamper-resistant records**: role-based permissions so that changes to a land record require approval from both the landowner and a government official, with a full audit trail, to prevent the kind of document alteration my grandfather faced
- 🪪 **Real authentication** for citizens and officers
- 🔎 **Deed verification** and ownership history

## ⚠️ Current Limitations

- The login screen is a demo and does not verify accounts yet
- Data and imagery are synthetic
- AI scan results are a decision-support signal and should be confirmed by an officer before any action

## 👩‍💻 Team DevWitches

_<Gayatri,Jenitha,Sphoorthi,Prathyusha>_

---

_Built for the AWS Hackathon._
