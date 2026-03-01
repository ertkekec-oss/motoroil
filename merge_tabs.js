const fs = require('fs');

const p1 = fs.readFileSync('part1.tsx', 'utf8');
const p2 = fs.readFileSync('part2.tsx', 'utf8');
let p3 = fs.readFileSync('part3.tsx', 'utf8');
const originalTabs = fs.readFileSync('enterprise_tabs.tsx', 'utf8');

// Replace the placeholder in part3 with originalTabs
const placeholder = `{/* OTHER TABS (Shifts, Leaves, Attendance, Puantaj, Payroll) MAPPED THE SAME WAY SIMPLIFIED... */}
                    {['shifts', 'leaves', 'attendance', 'puantaj', 'payroll'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <Info size={40} className="mb-4" />
                            <h3 className={\`text-[18px] font-semibold mb-2 \${textMain}\`}>Modül Güncelleniyor</h3>
                            <p className={\`text-[13px] \${textMuted}\`}>Bu görünüm "Enterprise Human Capital" altyapısına taşınıyor.</p>
                        </div>
                    )}`;

p3 = p3.replace(placeholder, originalTabs);

fs.writeFileSync('src/components/StaffManagementContent.tsx', p1 + '\n' + p2 + '\n' + p3);
console.log('Merged successfully.');
