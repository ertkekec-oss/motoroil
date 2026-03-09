import React from 'react';

export default function HelpTicketDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="max-w-7xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Talep Detayı #{params.id}</h1>
            <p className="text-gray-500">UI implementation is deferred. API and Service layers are ready.</p>
        </div>
    );
}
