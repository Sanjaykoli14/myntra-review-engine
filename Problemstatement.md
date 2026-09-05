# Myntra Review Engine — Problem Statement

## Context

Myntra users frequently browse fashion products and add items to their wishlist, signaling explicit interest and potential purchase intent. However, many wishlisted products never convert into purchases.

The business goal is to **increase the percentage of users who purchase at least one wishlisted item within 30 days of adding it to their wishlist**.

To understand this conversion gap, we need to analyze real user conversations and reviews to identify the underlying reasons users save products but delay, reconsider, or abandon the purchase.

## Objective

Build a lightweight **AI-powered Review & Discovery Engine** that analyzes a CSV dataset of Myntra user reviews/conversations and uncovers the key barriers between **wishlist intent and purchase**.

The engine should go beyond basic sentiment analysis. It should identify recurring themes, quantify patterns where possible, compare opportunity areas, and generate actionable insights that can inform product decisions.

## Questions the AI Engine Must Answer

The assistant should be able to answer:

1. Why do users add fashion products to their wishlist?
2. What prevents wishlisted products from eventually being purchased?
3. What uncertainties remain after users have identified a product they like?
4. What causes users to postpone a purchase?
5. How do users compare multiple shortlisted products?
6. What information do users seek outside Myntra/AJIO before purchasing?
7. What role do **fit, size, styling, price, reviews, occasion, and social validation** play in purchase decisions?
8. When is the wishlist used as genuine purchase intent versus simply as a bookmarking mechanism?
9. How do these behaviors differ across user segments?
10. What unmet needs emerge consistently across user conversations?

## Required Analysis

The engine should provide:

### 1. Theme Analysis

Automatically identify and group recurring themes such as:

* Price & discounts
* Fit & size uncertainty
* Product quality
* Reviews & ratings
* Styling & outfit compatibility
* Occasion-based purchase
* Social validation
* Return/exchange concerns
* Product comparison
* Availability/stock
* Wishlist as bookmarking
* Need for more information

Show the **frequency and percentage** of reviews/conversations associated with each theme wherever the data supports it.

### 2. Sentiment Analysis

Classify user sentiment as:

* Positive
* Neutral
* Negative

Where useful, connect sentiment to specific themes to identify which areas create the most friction.

### 3. Opportunity Analysis

The engine should identify potential conversion opportunities by comparing:

**Frequency → User pain → Potential impact on wishlist conversion**

The output should help answer:

> **Which problems are most responsible for users not converting wishlisted products into purchases?**

Avoid simply ranking themes by frequency. A frequent theme is not automatically the highest-value opportunity.

### 4. Segment Analysis

Where sufficient information exists in the dataset, compare behaviors across user segments, such as:

* Men vs Women
* Frequent vs occasional shoppers
* Price-sensitive vs convenience-oriented users
* Different age groups or locations
* Other identifiable behavioral segments

If the dataset does not contain enough information for a particular segmentation, clearly state that the analysis cannot be reliably performed.

## AI Assistant Interface

Create an interactive **chat-based discovery assistant**.

### Main Chat Window

The center of the application should contain a conversational AI interface where users can ask questions about the review dataset.

Display **4 suggested questions** by default, for example:

* Why do users wishlist products but not buy them?
* What are the biggest purchase barriers?
* What uncertainties do users have before purchasing?
* What are the biggest conversion opportunities?

Include a **"More Questions"** option that expands the remaining suggested questions.

Users should also be able to type their own questions into the chat window.

### AI Response

For each question, the assistant should provide:

* Direct answer
* Key themes
* Supporting evidence from reviews
* Quantified findings where possible
* Relevant percentages/counts
* Comparison between themes or segments where applicable
* Clear product/opportunity implication

The assistant should avoid making unsupported claims when the dataset does not contain sufficient evidence.

## Left Sidebar — Dataset Overview

Create a left-side dashboard showing the dataset at a glance.

Display:

### Dataset Overview

* **Total Reviews**
* **Play Store Reviews**
* **App Store Reviews**
* **Reddit Reviews**
* **Average Rating**
* **Positive Reviews %**
* **Neutral Reviews %**
* **Negative Reviews %**

### Source Breakdown

Show how the dataset is distributed across:

**Google Play Store | Apple App Store | Reddit**

Use simple visual indicators such as cards, progress bars, or a small chart.

### Theme Summary

Also show the top recurring themes identified from the dataset, with their review count/percentage.

## Core Requirement

The product should feel like an **AI-powered research and discovery tool**, not a simple review dashboard.

The system must help a Product Manager move from:

**Raw Reviews → Themes → User Problems → Evidence → Opportunity Areas → Product Insights**

The final output should make it easy to answer:

> **"Why are users adding products to their wishlist but not purchasing them, and which product opportunity should Myntra prioritize to improve wishlist-to-purchase conversion?"**

## Technical Direction

Build the application as a lightweight web-based prototype.

The review dataset will be provided as a **CSV file**.

Use a **Retrieval-Augmented Generation (RAG)** approach so that the AI retrieves relevant reviews from the dataset before generating its answer.

The system should:

1. Load and process the CSV.
2. Clean and structure the review data.
3. Generate embeddings/index the reviews for retrieval.
4. Retrieve relevant reviews based on the user's question.
5. Analyze retrieved evidence.
6. Generate a grounded response.
7. Display supporting evidence and quantitative insights.
8. Maintain the conversation in the chat interface.

The system should prioritize **evidence-grounded answers from the uploaded dataset** and should not hallucinate findings that are not supported by the reviews.

## System Workflow

1. **Data Ingestion**
   * Load CSV file of Myntra reviews (`reviews.csv`) which are cleaned and structured.

2. **User Input**
   * User clicks on predefined/suggested questions or types custom questions into the chat interface.

3. **Integration Layer**
   * Filter, search, and prepare relevant data and context from the dataset and pass the results to the LLM.

4. **Recommendation Engine (Groq)**
   * Use LLM (powered by Groq) to generate in-depth explanations, thematic summaries, and data-backed product recommendations.

5. **Output Display**
   * Present grounded output, key themes, supporting evidence quotes, quantitative metrics, and actionable PM insights in the UI.
