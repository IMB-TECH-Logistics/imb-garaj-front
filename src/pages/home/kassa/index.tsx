import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/datatable";
import { useCostCols } from "./cols";

const Kassa = () => {
  const fakeCostData = [
    {
      amount: "1500000",
      owner: "Alibek Toshmatov",
      created: "2024-01-15T09:30:00",
      desc: "Yoqilg'i xarajatlari",
    },
    {
      amount: "750000",
      owner: "Sardor Rahimov",
      created: "2024-02-03T11:45:00",
      desc: "Ta'mirlash ishlari",
    },
    {
      amount: "",
      owner: "Malika Yusupova",
      created: "2024-02-20T08:00:00",
      desc: "",
    },
    {
      amount: "3200000",
      owner: "Jasur Mirzaev",
      created: "2024-03-05T14:15:00",
      desc: "Ehtiyot qismlar",
    },
    {
      amount: "980000",
      owner: "Nodira Karimova",
      created: "",
      desc: "Ish haqi to'lovi",
    },
    {
      amount: "12750000",
      owner: "Bobur Xasanov",
      created: "2024-04-10T10:00:00",
      desc: "Uskunalar xarajati",
    },
    {
      amount: "450000",
      owner: "",
      created: "2024-05-01T16:00:00",
      desc: "",
    },
  ]

  const cols = useCostCols()

  return (
    <div>
      <DataTable
        numeration
        columns={cols}
        data={fakeCostData || []}
        head={
          <div className="flex items-center gap-3 mb-3 ">
            <h1 className="text-xl font-semibold">
              {`Kassa `}
            </h1>
            <Badge className="text-sm">25</Badge>
          </div>
        }
        paginationProps={{
          totalPages: 3,
        }}
      />
    </div>
  );
};

export default Kassa;