document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('age-calculator-form');
    const bsYearInput = document.getElementById('bs-year');
    const bsMonthInput = document.getElementById('bs-month');
    const bsDayInput = document.getElementById('bs-day');

    const toBsYearInput = document.getElementById('to-bs-year');
    const toBsMonthInput = document.getElementById('to-bs-month');
    const toBsDayInput = document.getElementById('to-bs-day');

    const errorMessage = document.getElementById('error-message');
    const resultSection = document.getElementById('result-section');
    const adDateResult = document.getElementById('ad-date-result');
    const ageSpanResult = document.getElementById('age-span-result');

    // Pre-fill 'To Date' with today's BS Date 
    try {
        if (typeof window.NepaliDate !== 'undefined') {
            const NepaliDateClass = window.NepaliDate.default || window.NepaliDate;
            const todayBs = new NepaliDateClass();
            toBsYearInput.value = todayBs.getYear();
            toBsMonthInput.value = todayBs.getMonth() + 1; // 0-indexed month
            toBsDayInput.value = todayBs.getDate();
        }
    } catch (e) { console.error(e); }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Hide previous results/errors
        errorMessage.classList.add('hidden');
        resultSection.classList.add('hidden');

        const year = parseInt(bsYearInput.value, 10);
        const month = parseInt(bsMonthInput.value, 10);
        const day = parseInt(bsDayInput.value, 10);

        const toYear = parseInt(toBsYearInput.value, 10);
        const toMonth = parseInt(toBsMonthInput.value, 10);
        const toDay = parseInt(toBsDayInput.value, 10);

        // Validation
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(toYear) || isNaN(toMonth) || isNaN(toDay)) {
            showError("Please fill in all date fields.");
            return;
        }

        if (month < 1 || month > 12 || day < 1 || day > 32 || toMonth < 1 || toMonth > 12 || toDay < 1 || toDay > 32) {
            showError("Please enter a valid month and day.");
            return;
        }

        try {
            if (typeof window.NepaliDate === 'undefined') {
                showError("Conversion library failed to load or is offline. Please check your setup.");
                return;
            }

            // The UMD library exports the constructor as window.NepaliDate.default or window.NepaliDate
            const NepaliDateClass = window.NepaliDate.default || window.NepaliDate;

            let adDateObj;
            let endAdDateObj;

            // The nepali-date-converter library typically uses 0-indexed months for its BS constructor
            const bsDate = new NepaliDateClass(year, month - 1, day);
            const toBsDateObj = new NepaliDateClass(toYear, toMonth - 1, toDay);

            function getAdDateSafe(nepaliDateInst) {
                if (typeof nepaliDateInst.toJsDate === 'function') {
                    return nepaliDateInst.toJsDate();
                } else if (typeof nepaliDateInst.getAD === 'function') {
                    const adParts = nepaliDateInst.getAD();
                    // Assumes getAD() returns 1-indexed months based on standard conventions, adjust if needed
                    return new Date(adParts.year, adParts.month - 1, adParts.date);
                } else {
                    return new Date(nepaliDateInst.getYear(), nepaliDateInst.getMonth(), nepaliDateInst.getDate());
                }
            }

            adDateObj = getAdDateSafe(bsDate);
            endAdDateObj = getAdDateSafe(toBsDateObj);

            // Extract local YYYY-MM-DD to avoid Timezone offset string bugs via toISOString()
            const adYear = adDateObj.getFullYear();
            const adMonth = String(adDateObj.getMonth() + 1).padStart(2, '0');
            const adDay = String(adDateObj.getDate()).padStart(2, '0');
            const adDateStr = `${adYear}-${adMonth}-${adDay}`;

            // Calculate Age span exactly
            if (adDateObj > endAdDateObj) {
                showError("Birth date cannot be after the chosen calculate date.");
                return;
            }

            const ageInfo = calculateExactAge(adDateObj, endAdDateObj);

            // Display Results
            adDateResult.textContent = adDateStr;
            ageSpanResult.textContent = `${ageInfo.years} Years ${ageInfo.months} Months ${ageInfo.days} Days`;

            resultSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            showError("Invalid BS date. Please verify the dates entered.");
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function calculateExactAge(birthDate, currentDate) {
        let years = currentDate.getFullYear() - birthDate.getFullYear();
        let months = currentDate.getMonth() - birthDate.getMonth();
        let days = currentDate.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            // Get the previous month's total days to adjust exact span
            const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            days += previousMonthDate.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    }
});
