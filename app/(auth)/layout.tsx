export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="varzea-pattern flex min-h-screen flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}
