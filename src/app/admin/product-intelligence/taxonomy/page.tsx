"use client";

import React, { useEffect, useState } from "react";

export default function TaxonomyAdminPage() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [parentId, setParentId] = useState("");

    useEffect(() => {
        fetchTaxonomy();
    }, []);

    const fetchTaxonomy = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/product-intelligence/taxonomy");
            const data = await res.json();
            setNodes(data);
        } catch (error) {
            console.error("Failed to load taxonomy tree", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch("/api/admin/product-intelligence/taxonomy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slug, parentId: parentId || undefined }),
            });
            setName("");
            setSlug("");
            setParentId("");
            fetchTaxonomy();
        } catch (error) {
            console.error("Failed to create taxonomy node", error);
        }
    };

    const renderTree = (nodes: any[]) => {
        return (
            <ul className="pl-4 border-l border-gray-200 mt-2 space-y-2">
                {nodes.map((node) => (
                    <li key={node.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">{node.name}</span>
                            <span className="text-xs text-gray-500">({node.slug})</span>
                            <span className="text-xs text-gray-400">ID: {node.id}</span>
                        </div>
                        {node.children && node.children.length > 0 && renderTree(node.children)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Taxonomy Management</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Card */}
                <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-1 h-fit">
                    <h2 className="text-lg font-semibold mb-4">Add Taxonomy Node</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="Engine Oil"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slug</label>
                            <input
                                type="text"
                                required
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="engine-oil"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Parent ID (Optional)</label>
                            <input
                                type="text"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="Parent node ID..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Add Node
                        </button>
                    </form>
                </div>

                {/* Tree Card */}
                <div className="card bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Taxonomy Tree</h2>
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading...</p>
                    ) : nodes.length === 0 ? (
                        <p className="text-sm text-gray-500">No nodes found.</p>
                    ) : (
                        <div className="overflow-auto max-h-[600px] border p-4 rounded-lg bg-gray-50">
                            {renderTree(nodes)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
