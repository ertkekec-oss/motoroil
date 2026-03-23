import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createCategoryAction } from "@/actions/adminGovernanceActions";
import { Layers, Network, Tag, ChevronRight, FolderTree } from "lucide-react";

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

    // Server-side recursive tree renderer using modern HTML5 <details> for JS-less toggling
    const renderNode = (node: any, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isRoot = level === 0;

        return (
            <details key={node.id} className="group" open={isRoot}>
                <summary className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/[0.02] list-none select-none">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 transition-colors ${
                            isRoot 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' 
                                : hasChildren 
                                    ? 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400'
                                    : 'text-gray-300 dark:text-gray-600'
                        }`}>
                            {hasChildren ? (
                                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                        </div>
                        <span className={`text-sm ${isRoot ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                            {node.name}
                        </span>
                        {hasChildren && (
                            <span className="text-[10px] items-center flex px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 font-medium">
                                {node.children.length}
                            </span>
                        )}
                    </div>
                    
                    {/* Slug badge hiding on extra small screens */}
                    <div className="hidden sm:flex items-center px-2 py-1 rounded border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-[#0B0D10] text-[10px] font-mono text-gray-400 truncate max-w-[200px]">
                        {node.slug}
                    </div>
                </summary>

                {hasChildren && (
                    <div className="mt-1 ml-3 pl-3 border-l border-gray-200 dark:border-white/[0.05] space-y-0.5 flex flex-col">
                        {node.children.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((child: any) => renderNode(child, level + 1))}
                    </div>
                )}
            </details>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D10] font-sans">
            {/* Header Section */}
            <div className="bg-white dark:bg-[#111317] border-b border-gray-100 dark:border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                <Network className="w-5 h-5" />
                                <span className="text-xs font-bold tracking-wider uppercase">Global Taxonomy</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Universal Catalog Categories
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                                Manage the deeply nested network hierarchy for B2B trade endpoints. Defines accurate ML routing across Hub instances.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] text-sm font-medium text-gray-600 dark:text-gray-300">
                                {categories.length} Root Nodes
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                4 Levels Deep
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Tree View Panel (Takes 3 columns) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-[#111317] rounded-2xl shadow-sm border border-gray-100 dark:border-white/[0.04] overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.04] flex items-center gap-3">
                                <FolderTree className="w-5 h-5 text-gray-400" />
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Active Hierarchy Network</h2>
                            </div>
                            
                            <div className="p-4 bg-gray-50/50 dark:bg-transparent max-h-[70vh] overflow-y-auto">
                                {categories.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                        <Network className="w-12 h-12 mb-4 opacity-20" />
                                        <p>No taxonomy definitions found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {categories.map(root => renderNode(root, 0))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Panel (Takes 1 column) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#111317] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/[0.04] sticky top-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Append Node</h2>
                            </div>
                            
                            <form action={handleAdd} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Node Name
                                    </label>
                                    <input 
                                        name="name" 
                                        type="text" 
                                        className="w-full bg-gray-50 dark:bg-[#0B0D10] border border-gray-200 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-400" 
                                        placeholder="e.g. Engine Components" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Parent Mapping
                                    </label>
                                    <select 
                                        name="parentId" 
                                        className="w-full bg-gray-50 dark:bg-[#0B0D10] border border-gray-200 dark:border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="">None (Creates Root Node)</option>
                                        {categories?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm mt-4 active:scale-[0.98]">
                                    Provision Category
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
