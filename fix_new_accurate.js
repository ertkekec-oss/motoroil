const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/new/NewWorkOrderClient.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace('<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1000px] mx-auto w-full">', '<div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full">');

c = c.replace('<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[20px] sm:rounded-[24px] shadow-sm p-4 sm:p-8">', '<div className="space-y-8">');

// I will find the EXACT string block that opens Step 1's space-y-6 container
// and insert the Customer box container right after it.
const step1Open = `{step === 1 && (
                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>`;
const step1Replacement = `{step === 1 && (
                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-8">
                                <div>`;

c = c.replace(step1Open, step1Replacement);

// I will close the Customer box right before {customerId && ( opens
const assetsOpen = `                            </div>

                            {customerId && (
                                <div className="pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2">`;
const assetsReplacement = `                            </div>
                        </div>

                        {customerId && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2">`;
c = c.replace(assetsOpen, assetsReplacement);

// Close assets box and open the final Step 1 form buttons area. Oh wait! The Buttons are under `customerId && (...)`. Let's look closely at where buttons are.
// Buttons line: `<div className="pt-6 sm:pt-8 flex justify-end">`
const buttonsOpen = `                            )}

                            <div className="pt-6 sm:pt-8 flex justify-end">`;
const buttonsReplacement = `                            </div>
                            )}

                            <div className="flex justify-end mt-4">`;
c = c.replace(buttonsOpen, buttonsReplacement);

// Now for step 2. We want to wrap step 2 in a bg-white dark:bg-slate-900 border... just like step 1.
// but step 2 ALREADY is inside `space-y-6`. 
const step2Open = `{step === 2 && (
                        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">`;
const step2Replacement = `{step === 2 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">`;
c = c.replace(step2Open, step2Replacement);

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed accurately!');
