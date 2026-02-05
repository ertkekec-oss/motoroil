
export interface StatementTransaction {
    id: string; // Temporary ID for UI
    date: string;
    description: string;
    amount: number;
    type: 'spending' | 'payment'; // Spending = Expense, Payment = Debt Payment
}

export async function parseStatementPdf(buffer: Buffer): Promise<StatementTransaction[]> {
    try {
        // Use require inside the function to ensure it is only loaded at runtime in a Node.js environment
        // preventing build-time bundling issues with Next.js
        // @ts-ignore
        const pdf = require('pdf-parse');

        const data = await pdf(buffer);
        const text = data.text;

        console.log("PDF parsed length:", text.length);

        const lines = text.split('\n');
        const transactions: StatementTransaction[] = [];

        // Regex for date: DD.MM.YYYY or DD/MM/YYYY
        // Matches start of line
        const dateRegex = /^(\d{2}[./]\d{2}[./]\d{4})/;

        // Strict currency regex for TR format: 
        // Matches: 1.250,00 or 1250,50 or 50,00
        // Optional + or - at the end
        // Must have a comma and exactly 2 decimal places to be considered a valid statement amount
        const priceRegex = /(\b\d{1,3}(\.\d{3})*,\d{2}[+-]?)\b/;

        lines.forEach((line: string, index: number) => {
            try {
                const cleanLine = line.trim();
                if (!cleanLine) return;

                const dateMatch = cleanLine.match(dateRegex);

                if (dateMatch) {
                    const dateStr = dateMatch[1];

                    // Get the text AFTER the date
                    const textAfterDate = cleanLine.substring(dateStr.length).trim();

                    // Find the FIRST occurrence of a price-like pattern in the remaining text
                    // We pick the first one because statements typically follow: Date | Description | Amount | Balance/Other
                    // Ziraat example: Date | Description | Amount(TL) | Amount(USD) | Points
                    // So the first valid amount we encounter is the transaction amount.
                    const amountMatch = textAfterDate.match(priceRegex);

                    if (amountMatch) {
                        const fullAmountStr = amountMatch[0]; // e.g. "650,00+" or "83,00"

                        // The description is everything between Date and the start of the Amount
                        // amountMatch.index is the index relative to textAfterDate
                        const description = textAfterDate.substring(0, amountMatch.index).trim();

                        // Parse Amount
                        let isPayment = false;
                        let amountValueStr = fullAmountStr;

                        // Check for sign
                        if (fullAmountStr.endsWith('+')) {
                            isPayment = true; // explicitly marked as payment/credit
                            amountValueStr = fullAmountStr.replace('+', '');
                        } else if (fullAmountStr.endsWith('-')) {
                            // Usually negative is payment too? Or strictly debt?
                            // In Bankkart statement:
                            // No sign => Spending (Debt)
                            // + sign => Payment (Credit)
                            // We will adhere to this usage.
                            amountValueStr = fullAmountStr.replace('-', '');
                        }

                        // Parse number (TR format: remove dots, replace comma with dot)
                        const parsedAmount = parseFloat(amountValueStr.replace(/\./g, '').replace(',', '.'));

                        if (!isNaN(parsedAmount) && description.length > 0) {
                            transactions.push({
                                id: `tx-${index}-${Date.now()}`,
                                date: dateStr,
                                description: description,
                                amount: Math.abs(parsedAmount),
                                type: isPayment ? 'payment' : 'spending'
                            });
                        }
                    }
                }
            } catch (innerError) {
                console.error("Error parsing line:", index, line, innerError);
            }
        });

        return transactions;

    } catch (e) {
        console.error("PDF Parsing error:", e);
        // Throw a simpler error message to be caught by the API
        throw new Error("PDF içeriği okunamadı. Lütfen şifresiz ve geçerli bir PDF olduğundan emin olun.");
    }
}
