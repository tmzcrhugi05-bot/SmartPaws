
const BOOKING_KEYS = {
    customer: "smartPawsCustomer",
    haircut: "selectedCut",
    booking: "smartPawsBooking"
};

// Read saved information from localStorage.
function readSavedData(key, fallback = null) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

// Save information to localStorage.
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Format prices in Philippine pesos.
function money(value) {
    return "₱" + (Number(value) || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// CUSTOMER INFORMATION ON BOOKING PAGE
document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("name");
    const contactInput = document.getElementById("contact no.");
    const emailInput = document.getElementById("email");

    // Run only on the page containing these customer fields.
    if (!nameInput || !contactInput) return;

    const customer = readSavedData(BOOKING_KEYS.customer, {});

    nameInput.value = customer.name || "";
    contactInput.value = customer.contact || "";

    if (emailInput) {
        emailInput.value = customer.email || "";
    }

    ["dogBtn", "catBtn"].forEach((id) => {
        const button = document.getElementById(id);

        if (!button) return;

        button.addEventListener("click", (event) => {
            const data = {
                name: nameInput.value.trim(),
                contact: contactInput.value.trim(),
                email: emailInput?.value.trim() || ""
            };

            if (!data.name || !data.contact) {
                event.preventDefault();
                alert("Please enter your name and contact number.");
                return;
            }

            saveData(BOOKING_KEYS.customer, data);
        });
    });
});


// SAVE SELECTED HAIRCUT AND GO TO ADDITIONAL SERVICES
function selectHaircut(breedName, cutName, cutPrice, sourcePage) {
    const haircut = {
        breed: breedName,
        name: cutName,
        price: Number(cutPrice) || 0,
        backLink: sourcePage || "aspin.html"
    };

    saveData(BOOKING_KEYS.haircut, haircut);

    saveData(BOOKING_KEYS.booking, {
        haircut,
        addOns: [],
        addOnsTotal: 0,
        grandTotal: haircut.price
    });

    window.location.href = "additional services.html";
}


// ADDITIONAL SERVICES AND PRICE CALCULATION
document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".service-checkbox");

    // Run only on the additional-services page.
    if (!checkboxes.length) return;

    const haircut = readSavedData(BOOKING_KEYS.haircut);

    if (!haircut) {
        alert("Please select a haircut first.");
        window.location.href = "booking.html";
        return;
    }

    const nameEl = document.getElementById("selected-cut-name");
    const priceEl = document.getElementById("selected-cut-price");
    const subtotalEl = document.getElementById("service-subtotal");
    const totalEl = document.getElementById("total-price");

    if (nameEl) {
        nameEl.textContent =
            `${haircut.breed ? haircut.breed + " - " : ""}${haircut.name}`;
    }

    if (priceEl) {
        priceEl.textContent = money(haircut.price);
    }

    function calculateTotal() {
        const addOns = [];
        let addOnsTotal = 0;

        checkboxes.forEach((checkbox) => {
            if (!checkbox.checked) return;

            const price = Number(checkbox.value) || 0;

            addOns.push({
                name: checkbox.dataset.name || "Additional Service",
                price
            });

            addOnsTotal += price;
        });

        const grandTotal = (Number(haircut.price) || 0) + addOnsTotal;

        if (subtotalEl) {
            subtotalEl.textContent = money(addOnsTotal);
        }

        if (totalEl) {
            totalEl.textContent = money(grandTotal);
        }

        saveData(BOOKING_KEYS.booking, {
            haircut,
            addOns,
            addOnsTotal,
            grandTotal
        });
    }

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", calculateTotal);
    });

    calculateTotal();
});


// CHECKOUT, GCASH QR, BOOKING CONFIRMATION, AND RECEIPT
document.addEventListener("DOMContentLoaded", () => {
    const checkoutForm = document.getElementById("checkoutForm");

    // Run only on the checkout page.
    if (!checkoutForm) return;

    const booking = readSavedData(BOOKING_KEYS.booking, {});
    const haircut = booking.haircut || readSavedData(BOOKING_KEYS.haircut);
    const customer = readSavedData(BOOKING_KEYS.customer, {});

    const customerName = document.getElementById("customerName");
    const contactNumber = document.getElementById("contactNumber");
    const email = document.getElementById("email");
    const petName = document.getElementById("petName");
    const notesInput = document.getElementById("notes");

    const breedEl = document.getElementById("petBreed");
    const haircutNameEl = document.getElementById("haircutName");
    const haircutPriceEl = document.getElementById("haircutPrice");
    const servicesEl = document.getElementById("additionalServices");
    const addOnsTotalEl = document.getElementById("addOnsTotal");
    const grandTotalEl = document.getElementById("grandTotal");

    const paymentMessage = document.getElementById("paymentMessage");
    const gcashQRSection = document.getElementById("gcashQRSection");
    const receipt = document.getElementById("receipt");

    // Load previously saved customer information.
    if (customerName) customerName.value = customer.name || "";
    if (contactNumber) contactNumber.value = customer.contact || "";
    if (email) email.value = customer.email || "";

    // Prevent checkout if no haircut has been selected.
    if (!haircut) {
        if (breedEl) breedEl.textContent = "-";
        if (haircutNameEl) haircutNameEl.textContent = "-";
        if (haircutPriceEl) haircutPriceEl.textContent = money(0);
        if (servicesEl) servicesEl.textContent = "No services selected.";
        if (addOnsTotalEl) addOnsTotalEl.textContent = money(0);
        if (grandTotalEl) grandTotalEl.textContent = money(0);

        checkoutForm.addEventListener("submit", (event) => {
            event.preventDefault();
            alert("Please select a haircut before checkout.");
        });

        return;
    }

    const addOns = Array.isArray(booking.addOns) ? booking.addOns : [];
    const haircutPrice = Number(haircut.price) || 0;

    const addOnsTotal = addOns.reduce(
        (sum, service) => sum + (Number(service.price) || 0),
        0
    );

    const grandTotal = haircutPrice + addOnsTotal;

    // Display the booking summary.
    if (breedEl) breedEl.textContent = haircut.breed || "Pet";
    if (haircutNameEl) haircutNameEl.textContent = haircut.name || "Grooming";
    if (haircutPriceEl) haircutPriceEl.textContent = money(haircutPrice);
    if (addOnsTotalEl) addOnsTotalEl.textContent = money(addOnsTotal);
    if (grandTotalEl) grandTotalEl.textContent = money(grandTotal);

    // Display selected additional services.
    if (servicesEl) {
        servicesEl.replaceChildren();

        if (addOns.length === 0) {
            servicesEl.textContent = "No additional services selected.";
        } else {
            addOns.forEach((service) => {
                const row = document.createElement("div");
                row.className = "info-row";

                const name = document.createElement("span");
                name.textContent = service.name || "Additional Service";

                const price = document.createElement("strong");
                price.textContent = money(service.price);

                row.append(name, price);
                servicesEl.appendChild(row);
            });
        }
    }

    // Keep the saved total updated.
    saveData(BOOKING_KEYS.booking, {
        ...booking,
        haircut,
        addOns,
        addOnsTotal,
        grandTotal
    });

    // SHOW OR HIDE GCASH QR WHEN PAYMENT METHOD CHANGES.
    function updatePaymentMethod() {
        const selectedPayment = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            if (gcashQRSection) {
                gcashQRSection.hidden = true;
            }

            if (paymentMessage) {
                paymentMessage.textContent =
                    "Select your preferred payment method.";
            }

            return;
        }

        // Show the QR only for GCash.
        if (gcashQRSection) {
            gcashQRSection.hidden = selectedPayment.value !== "GCash";
        }

        if (!paymentMessage) return;

        if (selectedPayment.value === "GCash") {
            paymentMessage.textContent =
                "GCash selected. Scan the QR code below to pay.";
        } else if (selectedPayment.value === "Maya") {
            paymentMessage.textContent =
                "Maya selected. Payment is not processed automatically in this demo.";
        } else {
            paymentMessage.textContent =
                "Cash selected. Please pay at the salon counter.";
        }
    }

    document.querySelectorAll('input[name="paymentMethod"]').forEach((option) => {
        option.addEventListener("change", updatePaymentMethod);
    });

    // Set the correct payment display when the page loads.
    updatePaymentMethod();


    // CONFIRM THE BOOKING.
    checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!checkoutForm.reportValidity()) return;

        const currentCustomer = {
            name: customerName.value.trim(),
            contact: contactNumber.value.trim(),
            email: email.value.trim()
        };

        if (!currentCustomer.name || !currentCustomer.contact) {
            alert("Please enter your name and contact number.");
            return;
        }

        if (!petName.value.trim()) {
            alert("Please enter your pet's name.");
            petName.focus();
            return;
        }

        const selectedPayment = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            alert("Please select a payment method.");
            return;
        }

        const confirmedBooking = {
            bookingId:
                "SP-" +
                Date.now().toString(36).toUpperCase() +
                "-" +
                Math.random().toString(36).slice(2, 6).toUpperCase(),

            customer: currentCustomer,
            petName: petName.value.trim(),
            breed: haircut.breed || "Pet",

            haircut: {
                name: haircut.name || "Grooming",
                price: haircutPrice
            },

            addOns: addOns.map((service) => ({
                name: service.name || "Additional Service",
                price: Number(service.price) || 0
            })),

            addOnsTotal,
            grandTotal,
            notes: notesInput.value.trim(),
            paymentMethod: selectedPayment.value,
            status: "Confirmed",
            createdAt: new Date().toISOString()
        };

        // Save the customer and confirmed booking.
        saveData(BOOKING_KEYS.customer, currentCustomer);
        saveData(BOOKING_KEYS.booking, {
            ...booking,
            ...confirmedBooking
        });

        // Get receipt elements.
        const receiptDetails = document.getElementById("receiptDetails");
        const receiptServices = document.getElementById("receiptServices");
        const receiptTotal = document.getElementById("receiptTotal");
        const receiptStatus = document.getElementById("receiptStatus");
        const downloadReceipt = document.getElementById("downloadReceipt");

        // Show booking details on the receipt.
        if (receiptDetails) {
            receiptDetails.replaceChildren();

            const details = [
                ["Booking ID", confirmedBooking.bookingId],
                ["Customer", confirmedBooking.customer.name],
                ["Contact Number", confirmedBooking.customer.contact],
                ["Pet Name", confirmedBooking.petName],
                ["Breed", confirmedBooking.breed],
                ["Payment Method", confirmedBooking.paymentMethod]
            ];

            details.forEach(([label, value]) => {
                const row = document.createElement("div");
                row.className = "info-row";

                const labelEl = document.createElement("span");
                labelEl.textContent = label;

                const valueEl = document.createElement("strong");
                valueEl.textContent = value;

                row.append(labelEl, valueEl);
                receiptDetails.appendChild(row);
            });
        }

        // Show haircut and additional services on the receipt.
        if (receiptServices) {
            receiptServices.replaceChildren();

            const allServices = [
                confirmedBooking.haircut,
                ...confirmedBooking.addOns
            ];

            allServices.forEach((service) => {
                const row = document.createElement("div");
                row.className = "info-row";

                const name = document.createElement("span");
                name.textContent = service.name;

                const price = document.createElement("strong");
                price.textContent = money(service.price);

                row.append(name, price);
                receiptServices.appendChild(row);
            });
        }

        if (receiptTotal) {
            receiptTotal.textContent = money(confirmedBooking.grandTotal);
        }

        if (receiptStatus) {
            if (confirmedBooking.paymentMethod === "Cash on Counter") {
                receiptStatus.textContent =
                    "Booking confirmed. Please pay at the salon counter.";
            } else if (confirmedBooking.paymentMethod === "GCash") {
                receiptStatus.textContent =
                    "Booking submitted. GCash payment must be verified by SmartPaws staff.";
            } else {
                receiptStatus.textContent =
                    "Booking confirmed. Maya payment is not processed automatically by this demo.";
            }
        }

        // DOWNLOAD THE RECEIPT AS A TEXT FILE.
        if (downloadReceipt) {
            downloadReceipt.onclick = () => {
                const lines = [
                    "SMARTPAWS - BOOKING RECEIPT",
                    "============================",
                    `Booking ID: ${confirmedBooking.bookingId}`,
                    `Customer: ${confirmedBooking.customer.name}`,
                    `Contact Number: ${confirmedBooking.customer.contact}`,
                    `Pet Name: ${confirmedBooking.petName}`,
                    `Breed: ${confirmedBooking.breed}`,
                    "",
                    "SERVICES",
                    `${confirmedBooking.haircut.name}: ${money(confirmedBooking.haircut.price)}`,
                    ...confirmedBooking.addOns.map(
                        (service) => `${service.name}: ${money(service.price)}`
                    ),
                    "",
                    `TOTAL AMOUNT: ${money(confirmedBooking.grandTotal)}`,
                    `PAYMENT METHOD: ${confirmedBooking.paymentMethod}`,
                    `STATUS: ${confirmedBooking.paymentMethod === "GCash" ? "AWAITING PAYMENT VERIFICATION" : "BOOKING CONFIRMED"}`,
                    "",
                    "Thank you for choosing SmartPaws!"
                ];

                const file = new Blob(
                    [lines.join("\r\n")],
                    { type: "text/plain;charset=utf-8" }
                );

                const url = URL.createObjectURL(file);
                const link = document.createElement("a");

                link.href = url;
                link.download =
                    `SmartPaws-Receipt-${confirmedBooking.bookingId}.txt`;

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };
        }

        // Hide checkout form and display the receipt.
        checkoutForm.hidden = true;

        if (receipt) {
            receipt.hidden = false;
            receipt.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        alert("Your booking has been confirmed!");
    });
});
