import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createCategoryAction } from "@/actions/adminGovernanceActions";
import { Layers, Network, Tag, ChevronRight, FolderTree } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from "@/components/ui/enterprise";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
    // Fetch up to 4 levels of depth
    const categories = await prisma.globalCategory.findMany({
        where: { parentId: null },
        include: {
            children: {
                include: { 
                    children: {
                        include: {
                            children: true
                        }
                    } 
                }
            },
            attributes: true
        },
        orderBy: { name: 'asc' }
    });

    async function handleAdd(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        const parentId = formData.get("parentId") as string;
        const slug = name.toLowerCase().replace(/ /g, "-");
        await createCategoryAction({ name, parentId: parentId || undefined, slug });
    }

    // Server-side recursive tree renderer using modern HTML5 <details>
    const renderNode = (node: any, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isRoot = level === 0;

        return (
            <details key={node.id} className="group" open={isRoot}>
                <summary className="flex items-center justify-between p-3 rounded-[14px] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 list-none select-none">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
                            isRoot 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                                : hasChildren 
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    : 'text-slate-300 dark:text-slate-600'
                        }`}>
                            {hasChildren ? (
                                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                        </div>
                        <span className={`text-sm ${isRoot ? 'font-black tracking-tight text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                            {node.name}
                        </span>
                        {hasChildren && (
                            <span className="text-[10px] items-center flex px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-white/5">
                                {node.children.length}
                            </span>
                        )}
                    </div>
                    
                    <div className="hidden sm:flex items-center px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 truncate max-w-[200px] shadow-sm">
                        {node.slug}
                    </div>
                </summary>

                {hasChildren && (
                    <div className="mt-1 ml-3 pl-3 border-l tracking-widest border-slate-200 dark:border-white/5 space-y-1 flex flex-col pt-1 pb-2">
                        {node.children.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((child: any) => renderNode(child, level + 1))}
                    </div>
                )}
            </details>
        );
    };

    return (
        <EnterprisePageShell
            title="Universal Catalog Categories"
            description="Manage the deeply nested network hierarchy for B2B trade endpoints. Defines accurate ML routing across Hub instances."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-center">
                    {categories.length} Root Nodes
                </div>
                <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 flex items-center gap-2 shadow-sm">
                    <Layers className="w-4 h-4" />
                    4 Levels Deep
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <EnterpriseCard noPadding>
                        <EnterpriseSectionHeader 
                            title="Active Hierarchy Network" 
                            icon={<FolderTree className="h-5 w-5" />}
                            className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20"
                        />
                        
                        <div className="p-4 bg-transparent max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {categories.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                    <Network className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-black tracking-widest uppercase">No taxonomy definitions found</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {categories.map(root => renderNode(root, 0))}
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>
                </div>

                <div className="lg:col-span-1">
                    <EnterpriseCard className="sticky top-8">
                        <EnterpriseSectionHeader title="Append Node" icon={<Tag className="h-4 w-4" />} />
                        
                        <form action={handleAdd} className="space-y-5 mt-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">
                                    Node Name
                                </label>
                                <input 
                                    name="name" 
                                    type="text" 
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm" 
                                    placeholder="e.g. Engine Components" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">
                                    Parent Mapping
                                </label>
                                <div className="relative">
                                    <select 
                                        name="parentId" 
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none shadow-sm"
                                    >
                                        <option value="">None (Creates Root Node)</option>
                                        {categories?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                            
                            <EnterpriseButton variant="primary" type="submit" className="w-full mt-6 flex justify-center uppercase tracking-widest text-[10px] px-0 h-12">
                                <FolderTree className="w-4 h-4 mr-2" /> Provision Category
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
