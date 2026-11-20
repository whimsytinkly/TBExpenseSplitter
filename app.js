
const itemList = document.getElementById("item-list");
const addItemBtn = document.getElementById("add-item-btn");

const adjustmentList = document.getElementById("adjustment-list");
const addAdjustmentBtn = document.getElementById("add-adjustment-btn");

const orderTotalRmb = document.getElementById("order-total-rmb");
const orderTotalSgd = document.getElementById("order-total-sgd");
const exchangeRateDisplay = document.getElementById("exchange-rate");

const resultsList = document.getElementById("results-list");
const selectedTotalDisplay = document.getElementById("selected-total");


let itemCounter = 1;

function addItem() {
    itemCounter++;

    const itemRow = document.createElement("div");
    itemRow.className = "item-row";

    itemRow.innerHTML = `
        <div class="item-field">
            <label for="item-name-${itemCounter}">Item</label>
            <input
                type="text"
                id="item-name-${itemCounter}"
                class="input input-medium item-name"
                placeholder="e.g. Mimikyu plush"
            >
        </div>

        <div class="item-field">
            <label for="item-qty-${itemCounter}">Qty</label>
            <input
                type="number"
                id="item-qty-${itemCounter}"
                class="input input-medium item-qty"
                min="1"
                value="1"
            >
        </div>

        <div class="item-field">
            <label for="item-price-${itemCounter}">Unit price (¥)</label>
            <input
                type="number"
                id="item-price-${itemCounter}"
                class="input input-medium item-price"
                min="0"
                step="0.01"
                placeholder="0.00"
            >
        </div>

        <button
            type="button"
            class="button button-danger button-small remove-item-btn"
            aria-label="Remove item"
        >
            ✕
        </button>
    `;

    const subtotal = document.createElement("div");
    subtotal.className = "item-subtotal";
    subtotal.innerHTML = `Subtotal: <strong>¥0.00</strong>`;

    itemList.append(itemRow, subtotal);
    updateAdjustmentItems();
}

addItemBtn.addEventListener("click", addItem);


itemList.addEventListener("click", function (event) {
    if (event.target.closest(".remove-item-btn")) {
        const itemRow = event.target.closest(".item-row");
        const subtotal = itemRow.nextElementSibling;

        itemRow.remove();

        if (subtotal?.classList.contains("item-subtotal")) {
            subtotal.remove();
        }
        updateItemsTotal();
        updateAdjustmentItems();
    }
});

// Initialise the first item
addItem();

itemList.addEventListener("input", function (event) {
    const itemRow = event.target.closest(".item-row");

    if (event.target.matches(".item-name")) {
        updateAdjustmentItems();
    }
    if (!itemRow) return;

    const quantity = Number(itemRow.querySelector(".item-qty").value) || 0;
    const unitPrice = Number(itemRow.querySelector(".item-price").value) || 0;

    const subtotal = itemRow.nextElementSibling;
    const total = quantity * unitPrice;

    subtotal.querySelector("strong").textContent = `¥${total.toFixed(2)}`;
    updateItemsTotal();
    refreshResults();
});

function updateItemsTotal() {
    let total = 0;

    const subtotals = itemList.querySelectorAll(".item-subtotal strong");

    subtotals.forEach(function (subtotal) {
        const amount = Number(subtotal.textContent.replace("¥", "")) || 0;
        total += amount;
    });

    document.querySelector(".items-total strong").textContent = `¥${total.toFixed(2)}`;
}

let adjustmentCounter = 0;

// Add a new adjustment row to the adjustments list
function addAdjustment() {
    adjustmentCounter++;

    const adjustmentRow = document.createElement("div");
    adjustmentRow.className = "adjustment-row";
    adjustmentRow.dataset.type = "charge";

    adjustmentRow.innerHTML = `
    <div class="adjustment-header">
    <input
        type="text"
        class="input input-medium adjustment-name"
        placeholder="e.g. Shipping"
        aria-label="Adjustment description"
    >

    <button
        type="button"
        class="button button-danger button-small remove-adjustment-btn"
        aria-label="Remove adjustment"
    >
        ✕
    </button>
</div>
    <div class="adjustment-type-toggle">
        <button type="button" class="button button-medium adjustment-type-btn active" data-type="charge">
            + Extra charge
        </button>
        <button type="button" class="button button-medium adjustment-type-btn" data-type="discount">
            − Discount
        </button>
    </div>

    <div class="adjustment-fields">

    <div class="adjustment-field">
        <label>Amount</label>
        <div class="adjustment-amount-group">
            <input
                type="number"
                class="input input-medium adjustment-amount"
                min="0"
                step="0.01"
                placeholder="0.00"
            >

            <select class="input input-medium adjustment-currency">
                <option value="RMB" selected>RMB (¥)</option>
                <option value="SGD">SGD (S$)</option>
            </select>
        </div>
        <div class="adjustment-field">
    <label for="adjustment-scope-${adjustmentCounter}">Apply to</label>
            <select
                id="adjustment-scope-${adjustmentCounter}"
                class="input input-medium adjustment-scope"
            >
                <option value="all" selected>All items</option>
                <option value="selected">Selected items</option>
            </select>
        </div>
    </div>
</div>
<div class="adjustment-item-selection" hidden>
    <p>Select the items this adjustment applies to.</p>
</div>
`;
    adjustmentList.append(adjustmentRow);
    updateAdjustmentItems();
}

addAdjustmentBtn.addEventListener("click", addAdjustment);

adjustmentList.addEventListener("click", function (event) {
    const typeBtn = event.target.closest(".adjustment-type-btn");
    const removeBtn = event.target.closest(".remove-adjustment-btn");

    if (removeBtn) {
        const adjustmentRow = removeBtn.closest(".adjustment-row");
        adjustmentRow.remove();
        refreshResults();
        return;
    }
    if (!typeBtn) return;

    const adjustmentRow = typeBtn.closest(".adjustment-row");

    adjustmentRow.querySelectorAll(".adjustment-type-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });

    typeBtn.classList.add("active");
    adjustmentRow.dataset.type = typeBtn.dataset.type;
    refreshResults();
});

adjustmentList.addEventListener("change", function (event) {
    const adjustmentRow = event.target.closest(".adjustment-row");

    if (!adjustmentRow) return;

    if (event.target.matches(".adjustment-scope")) {
        const selection = adjustmentRow.querySelector(".adjustment-item-selection");

        selection.hidden = event.target.value !== "selected";
    }

    if (
        event.target.matches(".adjustment-scope, .adjustment-currency, .adjustment-item-checkbox")
    ) {
        refreshResults();
    }
});

// Update the item selection checkboxes for each adjustment
function updateAdjustmentItems() {
    const itemRows = itemList.querySelectorAll(".item-row");

    adjustmentList.querySelectorAll(".adjustment-row").forEach(function (adjustmentRow) {
        const selection = adjustmentRow.querySelector(".adjustment-item-selection");

        const selectedItems = Array.from(
            selection.querySelectorAll(".adjustment-item-checkbox:checked")
        ).map(function (checkbox) {
            return checkbox.value;
        });

        selection.innerHTML = "<p>Select the items this adjustment applies to.</p>";

        itemRows.forEach(function (itemRow, index) {
            const itemName = itemRow.querySelector(".item-name").value.trim();
            const itemId = itemRow.querySelector(".item-name").id;

            const label = document.createElement("label");
            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.value = itemId;
            checkbox.className = "adjustment-item-checkbox";
            checkbox.checked = selectedItems.includes(itemId);

            label.append(
                checkbox,
                document.createTextNode(itemName || `Item ${index + 1}`)
            );

            selection.append(label);
        });
    });
}

// Get the adjustments data from the DOM
function getAdjustments() {
    const adjustmentRows = adjustmentList.querySelectorAll(".adjustment-row");

    return Array.from(adjustmentRows).map(function (row) {
        const description = row.querySelector(".adjustment-name").value.trim();
        const amountValue = row.querySelector(".adjustment-amount").value;
        const currency = row.querySelector(".adjustment-currency").value;
        const scope = row.querySelector(".adjustment-scope").value;

        const selectedItemIds = Array.from(
            row.querySelectorAll(".adjustment-item-checkbox:checked")
        ).map(function (checkbox) {
            return checkbox.value;
        });

        return {
            description: description,
            type: row.dataset.type,
            amount: amountValue === "" ? null : Number(amountValue),
            currency: currency,
            scope: scope,
            selectedItemIds: selectedItemIds
        };
    });
}

// Get the items data from the DOM
function getItems() {
    const itemRows = itemList.querySelectorAll(".item-row");

    return Array.from(itemRows).map(function (row) {
        const name = row.querySelector(".item-name").value.trim();
        const quantity = Number(row.querySelector(".item-qty").value) || 0;
        const unitPrice = Number(row.querySelector(".item-price").value) || 0;

        return {
            id: row.querySelector(".item-name").id,
            name: name,
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: quantity * unitPrice
        };
    });
}

// Update the exchange rate display based on the order totals
function updateExchangeRate() {
    const totalRmb = Number(orderTotalRmb.value);
    const totalSgd = Number(orderTotalSgd.value);

    if (totalRmb <= 0 || totalSgd <= 0) {
        exchangeRateDisplay.textContent = "—";
        return;
    }

    const exchangeRate = totalSgd / totalRmb;

    exchangeRateDisplay.textContent = exchangeRate.toFixed(4);
}

orderTotalRmb.addEventListener("input", function () {
    updateExchangeRate();
    refreshResults();
});

orderTotalSgd.addEventListener("input", function () {
    updateExchangeRate();
    refreshResults();
});

// Get the items that an adjustment applies to based on its scope
function getApplicableItems(adjustment, items) {
    if (adjustment.scope === "all") {
        return items;
    }

    return items.filter(function (item) {
        return adjustment.selectedItemIds.includes(item.id);
    });
}

// Calculate the allocation share of an item based on its subtotal and the total of applicable items
function getAllocationShare(item, applicableItems) {
    const applicableTotal = applicableItems.reduce(
        function (total, currentItem) {
            return total + currentItem.subtotal;
        },
        0
    );

    if (applicableTotal <= 0) return 0;

    return item.subtotal / applicableTotal;
}

// Allocate an adjustment amount to applicable items based on their allocation shares
function allocateAdjustment(adjustment, items) {
    const applicableItems = getApplicableItems(adjustment, items);

    return applicableItems.map(function (item) {
        const share = getAllocationShare(item, applicableItems);

        return {
            itemId: item.id,
            currency: adjustment.currency,
            amount: adjustment.amount * share
        };
    });
}

// Allocate all adjustments to items and return the allocation results
function allocateAllAdjustments(items, adjustments) {
    return adjustments.flatMap(function (adjustment) {
        return allocateAdjustment(adjustment, items).map(function (allocation) {
            return {
                ...allocation,
                description: adjustment.description,
                type: adjustment.type
            };
        });
    });
}


// Get the signed amount of an allocation based on its type (charge or discount)
function getSignedAmount(allocation) {
    return allocation.type === "discount"
        ? -allocation.amount
        : allocation.amount;
}

// Calculate the total adjustments for each item in both RMB and SGD
function calculateItemCosts(items, allocations, exchangeRate) {
    return items.map(function (item) {
        const itemAllocations = allocations.filter(function (allocation) {
            return allocation.itemId === item.id;
        });

        const rmbAdjustments = itemAllocations
            .filter(function (allocation) {
                return allocation.currency === "RMB";
            })
            .reduce(function (total, allocation) {
                return total + getSignedAmount(allocation);
            }, 0);

        const sgdAdjustments = itemAllocations
            .filter(function (allocation) {
                return allocation.currency === "SGD";
            })
            .reduce(function (total, allocation) {
                return total + getSignedAmount(allocation);
            }, 0);

        return {
            ...item,
            rmbAdjustments: rmbAdjustments,
            sgdAdjustments: sgdAdjustments,
            adjustedRmb: item.subtotal + rmbAdjustments,
            convertedSgd: (item.subtotal + rmbAdjustments) * exchangeRate,
            finalSgd: (item.subtotal + rmbAdjustments) * exchangeRate + sgdAdjustments
        };
    });
}

function calculateResults() {
    const items = getItems();
    const adjustments = getAdjustments();

    const totalRmb = Number(orderTotalRmb.value);
    const totalSgd = Number(orderTotalSgd.value);

    if (totalRmb <= 0 || totalSgd <= 0) {
        return [];
    }

    const exchangeRate = totalSgd / totalRmb;

    const allocations = allocateAllAdjustments(items, adjustments);

    return calculateItemCosts(items, allocations, exchangeRate);
}

// Render the results in the results panel
function renderResults(results) {
    const previousQuantities = new Map();

    resultsList.querySelectorAll(".result-qty").forEach(function (input) {
        previousQuantities.set(input.dataset.itemId, Number(input.value) || 0);
    });
    resultsList.innerHTML = "";

    results.forEach(function (item) {
        const unitSgd = item.quantity > 0
            ? item.finalSgd / item.quantity
            : 0;

        const previousQuantity = previousQuantities.get(item.id) || 0;
        const selectedQuantity = Math.min(previousQuantity, item.quantity);

        const resultRow = document.createElement("div");
        resultRow.className = "result-row";

        resultRow.innerHTML = `
            <span class="result-item-name">
                ${item.name || "Unnamed item"}
            </span>

            <span class="result-unit-price">
                S$${unitSgd.toFixed(2)}
            </span>

            <input
                type="number"
                class="input input-medium result-qty"
                min="0"
                max="${item.quantity}"
                step="1"
                value="${selectedQuantity}"
                data-item-id="${item.id}"
                data-unit-price="${unitSgd}"
            >

            <span class="result-subtotal">—</span>
        `;

        resultsList.append(resultRow);
    });
}

// Update the total of selected items based on their quantities and unit prices
function updateSelectedTotal() {
    let total = 0;

    resultsList.querySelectorAll(".result-row").forEach(function (row) {
        const quantityInput = row.querySelector(".result-qty");
        const subtotalDisplay = row.querySelector(".result-subtotal");

        const quantity = Number(quantityInput.value) || 0;
        const unitPrice = Number(quantityInput.dataset.unitPrice) || 0;
        const subtotal = quantity * unitPrice;

        subtotalDisplay.textContent = quantity > 0
            ? `S$${subtotal.toFixed(2)}`
            : "—";

        total += subtotal;
    });

    selectedTotalDisplay.textContent = `S$${total.toFixed(2)}`;
}

// Listen for input events on the results list to update the selected total
resultsList.addEventListener("input", function (event) {
    if (!event.target.matches(".result-qty")) return;

    updateSelectedTotal();
});


// Refresh the results by recalculating and rendering them, and updating the selected total
function refreshResults() {
    const results = calculateResults();
    renderResults(results);
    updateSelectedTotal();
}

adjustmentList.addEventListener("input", function (event) {
    if (!event.target.matches(".adjustment-name, .adjustment-amount")) return;

    refreshResults();
});