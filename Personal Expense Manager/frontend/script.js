const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const date = document.getElementById("date");
const dropdownLabel = document.querySelector(".dropdown-label");
const fromDate = document.getElementById("from-date");
const toDate = document.getElementById("to-date");
const resultDiv = document.querySelector(".display-result");

const url = "http://127.0.0.1:5000";
let category = "Income";
let transactions = [];

// Handle category selection for the dropdown menu 
function handleSelect(option) {
  dropdownLabel.innerText = option;
  category = option;
}

// saving the transactions to the local storage
function saveTransactionsToLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Load transactions from localStorage
function loadTransactionsFromLocalStorage() {
  const savedTransactions = localStorage.getItem("transactions");
  return savedTransactions ? JSON.parse(savedTransactions) : [];
}

// Add transaction
async function addTransaction(e) {
  e.preventDefault();

  if (
    text.value.trim() === "" ||
    amount.value.trim() === "" ||
    date.value.trim() === ""
  ) {
    alert("Please add a description, amount, and date.");
    return;
  }

  const dataToSend = {
    description: text.value,
    category: category,
    amount: parseFloat(amount.value) * (category === "Expense" ? -1 : 1),
    date: date.value,
  };

  try {
    const response = await fetch(`${url}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      throw new Error("Failed to add transaction.");
    }

    const transaction = await response.json();
    transactions.push(transaction);
    addTransactionToDOM(transaction);
    updateValues();
    saveTransactionsToLocalStorage();
    resetForm();
  } catch (error) {
    console.error(error);
    alert("Error adding transaction.");
  }
}

// Add transaction to history tab
function addTransactionToDOM(transaction) {
  console.log("The transaction object is: ", transaction);

  const sign = transaction.amount < 0 ? "-" : "+";
  const item = document.createElement("li");
  item.classList.add(transaction.amount < 0 ? "minus" : "plus");
  item.innerHTML = `
    ${transaction.description} <span>${sign}${Math.abs(
    transaction.amount
  )}</span>
    <button class="delete-btn" onClick="removeTransaction(${
      transaction.id
    })">x</button>
  `;
  list.appendChild(item);
}

// Fetch transactions within a date range
async function getSummary() {
  if (!fromDate.value || !toDate.value) {
    alert("Please select both start and end dates.");
    return;
  }

  try {
    const response = await fetch(
      `${url}/transactions?start_date=${fromDate.value}&end_date=${toDate.value}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transactions.");
    }

    const transactions = await response.json();
    if (transactions.length === 0) {
      alert("No transactions found in the selected date range.");
      return;
    }

    const totalIncome = transactions
      .filter((t) => t.category === "Income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.category === "Expense")
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const netBalance = totalIncome - totalExpense;

    resultDiv.innerHTML = `
      <p><strong>Total Balance:</strong> Rs ${netBalance.toFixed(2)}</p>
      <p><strong>Total Income:</strong> Rs ${totalIncome.toFixed(2)}</p>
      <p><strong>Total Expense:</strong> Rs ${totalExpense.toFixed(2)}</p>
      <p><strong>Date Range:</strong> ${fromDate.value} to ${toDate.value}</p>
    `;
  } catch (error) {
    console.error(error);
    alert("Error fetching summary.");
  }
}

// Remove transaction
async function removeTransaction(id) {
  try {
    const response = await fetch(`${url}/expenses/${id}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Failed to delete transaction.");
    }

    transactions = transactions.filter((transaction) => transaction.id !== id);
    saveTransactionsToLocalStorage();
    init();
  } catch (error) {
    console.error(error);
    alert("Error deleting transaction.");
  }
}

// Update balance, income, and expenses
function updateValues() {
  const amounts = transactions.map((transaction) =>
    parseFloat(transaction.amount)
  );
  const total = amounts.reduce((acc, val) => acc + val, 0).toFixed(2);
  const income = amounts
    .filter((val) => val > 0)
    .reduce((acc, val) => acc + val, 0)
    .toFixed(2);
  const expense = (
    amounts.filter((val) => val < 0).reduce((acc, val) => acc + val, 0) * -1
  ).toFixed(2);

  balance.innerText = `Rs ${total}`;
  money_plus.innerText = `Rs ${income}`;
  money_minus.innerText = `Rs ${expense}`;
}

// Initializing the app
async function init() {
  list.innerHTML = "";
  transactions = loadTransactionsFromLocalStorage();

  console.log(transactions)

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === currentDate.getTime();
    })
    .forEach(addTransactionToDOM);

  updateValues();

  //const today = new Date().toISOString().split("T")[0];
  /*try {
    const response = await fetch(`${url}/expenses`);
    if (!response.ok) {
      throw new Error("Failed to fetch transactions.");
    }
    transactionsResponse = await response.json();
    //transactions = transactionsResponse
    saveTransactionsToLocalStorage();
    transactions
      .filter((transaction) => transaction.date === today)
      .forEach(addTransactionToDOM);
    updateValues();
  } catch (error) {
    console.error(error);
    alert("Error initializing app.");
  }*/
}

// Resetting the form fields 
function resetForm() {
  text.value = "";
  amount.value = "";
  date.value = "";
}

form.addEventListener("submit", addTransaction);
init();
