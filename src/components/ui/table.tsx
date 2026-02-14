import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: any) => (
  <table className={cn("w-full border", className)} {...props} />
);

export const TableHeader = (p:any)=><thead {...p}/>
export const TableBody = (p:any)=><tbody {...p}/>
export const TableRow = (p:any)=><tr {...p}/>
export const TableHead = (p:any)=><th {...p}/>
export const TableCell = (p:any)=><td {...p}/>
