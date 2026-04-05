import { redirect } from 'next/navigation';

export default function AssetsPage() {
    // For now, redirect to construction or show a basic UI
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Varlık ve Demirbaş Yönetimi</h1>
            <p>Bu modül şu anda Periodya Level 9-10 standartlarına göre inşa edilmektedir.</p>
        </div>
    );
}
