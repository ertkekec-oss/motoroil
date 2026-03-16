const fs = require('fs');
let text = fs.readFileSync('src/components/StaffManagementContent.tsx', 'utf-8');
text = text.replace("const [activeTab, setActiveTab] = useState('list'); // list, roles, performance, shifts, leaves, payroll, attendance, puantaj", "const [activeTab, setActiveTab] = useState('list'); // list, roles, performance, shifts, leaves, payroll, attendance, puantaj\n    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState('Sistem Yöneticisi');");
fs.writeFileSync('src/components/StaffManagementContent.tsx', text);
