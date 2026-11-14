
const itemList = document.getElementById("item-list");
const addItemBtn = document.getElementById("add-item-btn");

const adjustmentList = document.getElementById("adjustment-list");
const addAdjustmentBtn = document.getElementById("add-adjustment-btn");


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
        return;
    }
    if (!typeBtn) return;

    const adjustmentRow = typeBtn.closest(".adjustment-row");

    adjustmentRow.querySelectorAll(".adjustment-type-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });

    typeBtn.classList.add("active");
    adjustmentRow.dataset.type = typeBtn.dataset.type;
});

adjustmentList.addEventListener("change", function (event) {
    if (!event.target.matches(".adjustment-scope")) return;

    const adjustmentRow = event.target.closest(".adjustment-row");
    const selection = adjustmentRow.querySelector(".adjustment-item-selection");

    selection.hidden = event.target.value !== "selected";
});

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