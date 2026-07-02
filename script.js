
const appState = {
    salary: 0,
    expenses: [],
    currentCurrency: "INR",
    exchangeRate: 1,
    warningPlayed: false,
    chart: null
};
const warningSound = new Audio("./assets/beep-warning-sound.mp3");
const currencySymbols = {

    INR: "Rs.",

    USD: "$",

    EUR: "€",

    GBP: "£"

};
// =====================================
// DOM Elements
// =====================================

// Form
const expenseForm = document.getElementById("expenseForm");

// Inputs
const salaryInput = document.getElementById("salary");
const expenseNameInput = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");

// Dashboard
const salaryDisplay = document.getElementById("salaryDisplay");
const totalExpenseDisplay = document.getElementById("totalExpenseDisplay");
const balanceDisplay = document.getElementById("balanceDisplay");

// Expense List
const expenseList = document.getElementById("expenseList");

// Messages
const errorMessage = document.getElementById("errorMessage");
const warningBanner = document.getElementById("warningBanner");

// Buttons
const downloadReport = document.getElementById("downloadReport");
// =====================================
// Utility Functions
// =====================================

function formatCurrency(amount) {

    const converted = amount * exchangeRate;

    return `${currencySymbols[currentCurrency]} ${converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

}

function getTotalExpenses() {

    return expenses.reduce((total, expense) => {

        return total + expense.amount;

    }, 0);

}
// =====================================
// Handle Form Submission
// =====================================

function handleSubmit(event) {

    event.preventDefault();

    // Clear previous error
    errorMessage.textContent = "";

    // Read input values
    const salary = Number(salaryInput.value);

    const expenseName = expenseNameInput.value.trim();

    const expenseAmount = Number(expenseAmountInput.value);

    // Validation
    if (!salary || !expenseName || !expenseAmount) {

        errorMessage.textContent =
            "Please fill in all fields.";

        return;

    }

    if (salary <= 0 || expenseAmount <= 0) {

        errorMessage.textContent =
            "Salary and Expense Amount must be greater than zero.";

        return;

    }

    // Update application state
    currentSalary = salary;

    expenses.push({

        name: expenseName,

        amount: expenseAmount

    });

    // Refresh UI
    refreshDashboard();

    // Save data
    saveData();

    // Reset form
    expenseForm.reset();

    // Keep salary visible
    salaryInput.value = currentSalary;

}
// =====================================
// Refresh Dashboard
// =====================================

function refreshDashboard() {

    salaryDisplay.textContent = formatCurrency(currentSalary);

    renderExpenses();

    calculateBalance();

}
// =====================================
// Event Listeners
// =====================================

expenseForm.addEventListener("submit", handleSubmit);

downloadReport.addEventListener("click", generatePDF);
const currencySelect =
    document.getElementById("currencySelect");

currencySelect.addEventListener(

    "change",

    function () {

        changeCurrency(this.value);
    }
);
// =====================================
// Functions
// =====================================
async function changeCurrency(currency) {

    currentCurrency = currency;

    if (currency === "INR") {

        exchangeRate = 1;
        refreshDashboard();
        saveData();
        return;

    }

    try {

        const response = await fetch(
            `https://v6.exchangerate-api.com/v6/a926bb2824ae41273cf1fb54/latest/INR`
        );

        const data = await response.json();

        exchangeRate = data.conversion_rates[currency];

        refreshDashboard();

        saveData();

    }

    catch (error) {

        console.error(error);

        alert("Failed to load exchange rate.");

    }

}
// =====================================
// Render Expense List
// =====================================

function renderExpenses() {

    expenseList.innerHTML = "";

    if (expenses.length === 0) {

        expenseList.innerHTML = `
            <p style="
                text-align:center;
                color:gray;
                padding:30px;
            ">
                🎉 No expenses yet
            </p>
        `;

        return;
    }

    expenses.forEach((expense, index) => {

        const listItem = document.createElement("li");

        // Expense Info
        const expenseInfo = document.createElement("div");

        expenseInfo.innerHTML = `
            <strong>${expense.name}</strong>
            <br>
            <small>${formatCurrency(expense.amount)}</small>
        `;

        // Delete Button
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "🗑 Delete";

        deleteButton.classList.add("delete-btn");

        deleteButton.addEventListener("click", () => {

            if (confirm("Delete this expense?")) {

                deleteExpense(index);

            }

        });

        listItem.appendChild(expenseInfo);

        listItem.appendChild(deleteButton);

        expenseList.appendChild(listItem);

    });

}

// =====================================
// Calculate Balance
// =====================================

function calculateBalance() {

    const totalExpenses = getTotalExpenses();

    const balance = currentSalary - totalExpenses;

    totalExpenseDisplay.textContent =
        formatCurrency(totalExpenses);

    balanceDisplay.textContent =
        formatCurrency(balance);

    checkLowBalance(balance);

    updateChart(totalExpenses, balance);

}
// =====================================
// Low Balance Warning
// =====================================

function checkLowBalance(balance) {

    if (balance <= currentSalary * 0.10) {

        warningBanner.style.display = "block";

        balanceDisplay.style.color = "#ef4444";

        if (!warningPlayed) {

            warningSound.play().catch(() => { });

            warningPlayed = true;

        }

    }

    else {

        warningBanner.style.display = "none";

        balanceDisplay.style.color = "white";

        warningPlayed = false;

    }

}

// =====================================
// Update Chart
// =====================================

function updateChart(totalExpenses, balance) {

    const convertedExpenses = totalExpenses * exchangeRate;

    const convertedBalance = balance * exchangeRate;

    if (expenseChart) {
        expenseChart.destroy();
    }

    const ctx = document
        .getElementById("expenseChart")
        .getContext("2d");

    expenseChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: [
                `Balance (${currentCurrency})`,
                `Expenses (${currentCurrency})`
            ],

            datasets: [{

                data: [
                    convertedBalance,
                    convertedExpenses
                ],

                backgroundColor: [
                    "#22c55e",
                    "#ef4444"
                ]

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}

// =====================================
// Local Storage
// =====================================

function saveData() {

    localStorage.setItem(
        "salary",
        JSON.stringify(currentSalary)
    );

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "currency",
        currentCurrency
    );

}

// =====================================
// Load Saved Data
// =====================================

function loadData() {

    currentSalary = JSON.parse(

        localStorage.getItem("salary")

    ) || 0;

    const savedExpenses = JSON.parse(

        localStorage.getItem("expenses")

    ) || [];
    const savedCurrency =
        localStorage.getItem("currency") || "INR";

    currentCurrency = savedCurrency;

    currencySelect.value = savedCurrency;

    expenses.length = 0;

    expenses.push(...savedExpenses);

    salaryInput.value = currentSalary;

    changeCurrency(savedCurrency);
}

// =====================================
// Delete Expense
// =====================================

function deleteExpense(index) {

    expenses.splice(index, 1);

    refreshDashboard();

    saveData();

}
function generatePDF() {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(22);
    doc.text("Cash Flow Report", 20, y);
    y += 10;
    doc.text(
        `Currency: ${currentCurrency}`,
        20,
        y
    );

    y += 10;
    y += 10;

    doc.setFontSize(11);

    doc.text(
        "Generated: " + new Date().toLocaleString(),
        20,
        y
    );

    y += 10;

    y += 15;

    doc.setFontSize(14);

    doc.text(
        `Salary: ${formatCurrency(currentSalary)}`,
        20,
        y
    );
    y += 10;

    let totalExpenses = 0;

    expenses.forEach(function (expense) {

        totalExpenses += expense.amount;

        doc.text(
            `${expense.name} - ${formatCurrency(expense.amount)}`,
            20,
            y
        );
        y += 10;

    });

    const balance =
        currentSalary - totalExpenses;

    y += 10;

    doc.text(
        `Total Expenses: ${formatCurrency(totalExpenses)}`,
        20,
        y
    );

    y += 10;

    doc.text(
        `Remaining Balance: ${formatCurrency(balance)}`,
        20,
        y
    );

    doc.save("CashFlowReport.pdf");

}
// =====================================
// Initialization
// =====================================

loadData();

downloadReport.addEventListener(
    "click",
    generatePDF
);