---
title: "What Is a Neural Network?"
slug: "neural-networks"
module: "prerequisites"
sectionOrder: 0
description: "Section 0 of the prerequisites module."
---

A neural network is a program that learns patterns from data instead of being explicitly told the rules. Consider a traditional program for detecting spam emails: a programmer writes specific rules like "if the email contains 'free money,' mark it as spam." This works for the patterns the programmer anticipates, but fails on anything unexpected. A neural network takes a different approach — it is shown thousands of labeled examples ("this is spam," "this is not spam") and discovers the patterns itself, including patterns no human thought to look for.

At its core, a neural network is a series of mathematical operations organized into **layers**. Each layer is a group of **nodes** (also called neurons). Data enters the network at the first layer, gets transformed as it passes through the middle layers, and produces a result at the final layer. Every neural network has three types of layers:

- **Input layer:** the entry point for data. Each node in the input layer represents one feature of the input. For an image, each node might represent a single pixel value. For text (as we will see later), each node represents a numerical encoding of a word or word fragment. The input layer does not perform any computation — it simply passes the raw data into the network.

- **Hidden layers:** the layers between input and output where the network learns to detect patterns. These are called "hidden" because their internal operations are not directly visible — you see what goes in and what comes out, but the intermediate representations are opaque. A network can have one hidden layer or hundreds. Early hidden layers tend to learn simple patterns (edges in images, common character combinations in text). Deeper hidden layers combine those simple patterns into increasingly complex ones (faces in images, sentence structure in text). This progression from simple to complex is a fundamental property of deep neural networks.

- **Output layer:** the final layer that produces the network's result. The format of the output depends on the task. For a spam classifier, the output might be a single number between 0 and 1 representing the probability that an email is spam. For a language model (as we will see in Part 3), the output is a probability distribution across the entire vocabulary — a score for every possible next word.

![Neural network diagram](/svg/neural-network.svg)

### Weighted Connections

Every connection between two nodes has a **weight** — a number that determines how much influence one node has on the next. When data flows from one layer to the next, each value is multiplied by the weight on that connection. A large positive weight means "this input is very important for this output, and it pushes the result higher." A weight close to zero means "this input barely matters." A negative weight means "this input pushes the result in the opposite direction."

All inputs flow through the network in parallel. Every node in one layer sends its value to every node in the next layer simultaneously, each multiplied by the corresponding connection weight. The receiving node sums up all of these weighted inputs and passes the result through an **activation function** — a mathematical function that introduces non-linearity, allowing the network to learn complex patterns rather than just simple straight-line relationships. Without activation functions, stacking multiple layers would be no more powerful than a single layer, because chaining linear operations together just produces another linear operation.

When we talk about the "size" of a neural network, we are primarily counting the total number of weights (also called **parameters**). A small neural network might have thousands of parameters. A large language model has billions — GPT-3 has 175 billion, and some modern models exceed a trillion. Every single one of those parameters is a number that was adjusted during training to make the network's outputs more accurate. When we say knowledge is "baked into the weights," we mean the model's behavior is entirely determined by these numbers. You cannot change what the model knows or how it behaves without changing the weights themselves, either through additional training or by replacing the model entirely.

### How a Neural Network Learns

A neural network does not start out knowing anything. Before training, all of its weights are initialized to small random numbers. The network's outputs at this stage are essentially random — it has not yet learned any patterns. Training is the process that transforms these random weights into useful ones.

Training works through a loop called an **epoch**. One epoch means the network has seen every example in the training dataset once. A typical training run involves many epochs — the network passes through the entire dataset multiple times, refining its weights each time. Within each epoch, training follows a repeating cycle:

1. **Forward pass:** A training example (such as an image labeled "cat") is fed through the network. The data flows from the input layer through the hidden layers to the output layer, producing a prediction. On the first pass with random weights, this prediction is essentially a guess.

2. **Loss calculation:** The network's prediction is compared to the correct answer using a **loss function** (also called a cost function or objective function). The loss function produces a single number that measures how wrong the prediction was. A perfect prediction produces a loss of zero. A completely wrong prediction produces a high loss. The choice of loss function depends on the task — classification tasks typically use **cross-entropy loss**, which measures how far the predicted probability distribution is from the true answer. The critical point is that the loss function provides a precise, mathematical measurement of the network's error.

3. **Backpropagation:** This is the mathematical process that determines how much each individual weight contributed to the error. Starting from the output layer and working backward through the network (hence "back" propagation), the algorithm calculates the **gradient** for each weight — essentially, "if I increase this weight slightly, does the loss go up or down, and by how much?" This tells the network the direction and magnitude of each weight's contribution to the overall error.

4. **Weight update:** Each weight is adjusted slightly in the direction that reduces the loss. A weight that contributed to the error is nudged in the opposite direction. The size of each adjustment is controlled by the **learning rate** — a hyperparameter (a setting chosen before training begins, not learned during training) that determines how big each step is. A learning rate that is too large causes the network to overshoot and miss good solutions. A learning rate that is too small makes training painfully slow. Finding the right learning rate is one of the fundamental challenges of training neural networks.

```
 Forward Pass --> Loss Calculation
      ^                  |
      |                  v
 Weight Update <-- Backpropagation

 (repeat for every batch, across multiple epochs)
```

This four-step cycle (forward pass, loss calculation, backpropagation, weight update) repeats for every batch of training examples, across multiple epochs. Over millions or billions of iterations, the weights gradually converge on values that produce accurate predictions. Each pass through the cycle is a small incremental improvement — the network does not learn all at once, it learns by making its predictions slightly less wrong, over and over.

The result of training is a set of weights that encode the patterns found in the training data. These weights are saved as a file — this file is the "model." When we "use" a model, we load these weights, feed in new data, and run a forward pass to get a prediction. No further weight updates occur during normal use (called **inference**).

> **Why this matters for guardrails:** Knowledge in a neural network is distributed across billions of weights — it is not stored in a searchable database. You cannot open up a model and delete a specific fact it memorized, remove a bias it learned, or inspect what it "knows" about a topic. If the training data contained toxic content, misinformation, or private data, traces of that information are encoded somewhere in the weights — but you cannot locate or remove those traces without retraining the entire model. This is why external guardrails are necessary: since you cannot control what the model has learned internally, you must control what it is allowed to output.

---
