const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

const targetRepFind = `const completedTargetsCount = targets?.filter((t: any) => t.currentValue >= t.targetValue).length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[`;

const targetRepReplace = `const completedTargetsCount = targets?.filter((t: any) => t.currentValue >= t.targetValue).length || 0;
    
    const totalEstBonus = targets?.reduce((sum: any, t: any) => {
        let earned = 0;
        const progress = t.targetValue > 0 ? (t.currentValue / t.targetValue) : 0;
        if (progress >= 1) earned += Number(t.bonusAmount || 0);
        else earned += Number(t.estimatedBonus || 0);
        return sum + earned;
    }, 0) || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'PRİM (TAHMİNİ)', value: \`₺\${totalEstBonus.toLocaleString('tr-TR')}\`, icon: <DollarSign className="w-5 h-5"/>, bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-500' },`;
                
c = c.replace(targetRepFind, targetRepReplace);

fs.writeFileSync(f, c);
console.log('done fixing targets top pills');
