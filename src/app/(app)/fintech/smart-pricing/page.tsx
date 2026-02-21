"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToControlTower() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/fintech/control-tower');
    }, [router]);
    return null;
}
