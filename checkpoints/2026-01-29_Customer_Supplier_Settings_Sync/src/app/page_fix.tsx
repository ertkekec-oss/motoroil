`}</style>
      </div>
    </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container p-8">Yükleniyor...</div>}>
      <POSContent />
    </Suspense>
  );
}
