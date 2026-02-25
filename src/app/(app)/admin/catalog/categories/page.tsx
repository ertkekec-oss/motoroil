import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createCategoryAction } from "@/actions/adminGovernanceActions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
    const categories = await prisma.globalCategory.findMany({
        where: { parentId: null },
        include: {
            children: {
                include: { children: true }
            },
            attributes: true
        }
    });

    async function handleAdd(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        const parentId = formData.get("parentId") as string;
        const slug = name.toLowerCase().replace(/ /g, "-");
        await createCategoryAction({ name, parentId: parentId || undefined, slug });
    }

    return (
        <div className="p-6 bg-[#F6F7F9] min-h-screen text-slate-800 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F3A5F]">Catalog Categories</h1>
                        <p className="text-sm text-slate-500">Manage the global product hierarchy and attributes.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
                    {/* Form Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Add New Category</h2>
                        <form action={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category Name</label>
                                <input name="name" type="text" className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-[#1F3A5F] outline-none" placeholder="e.g. Engine Oil" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Parent Category</label>
                                <select name="parentId" className="w-full border rounded p-2 text-sm outline-none">
                                    <option value="">None (Root)</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button className="w-full bg-[#1F3A5F] text-white py-2 rounded font-bold hover:bg-[#152a45] transition-colors shadow-md">Create Category</button>
                        </form>
                    </div>

                    {/* List Panel */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b font-bold text-slate-600">Category Hierarchy</div>
                        <div className="divide-y divide-slate-100">
                            {categories.length === 0 ? (
                                <div className="p-10 text-center text-slate-400">No categories defined.</div>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-center font-bold text-[#1F3A5F]">
                                            <span>{cat.name}</span>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{cat.slug}</span>
                                        </div>
                                        {cat.children && cat.children.length > 0 && (
                                            <div className="ml-6 mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
                                                {cat.children.map(sub => (
                                                    <div key={sub.id} className="flex justify-between items-center text-sm text-slate-600">
                                                        <span>{sub.name}</span>
                                                        <span className="text-[10px] text-slate-400 italic">/{sub.slug}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
