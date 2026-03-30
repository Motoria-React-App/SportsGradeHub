import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CriteriaLeaderboard, CriterionRanking } from '@/utils/leaderboard-utils';

interface LeaderboardTableProps {
  criteriaLeaderboards: CriteriaLeaderboard[];
  isLoading?: boolean;
}

interface LeaderboardRow {
  rank: number;
  values: Record<string, CriterionRanking | null>;
}

export function LeaderboardTable({ criteriaLeaderboards, isLoading = false }: LeaderboardTableProps) {
  const { columns, data } = useMemo(() => {
    if (criteriaLeaderboards.length === 0) {
      return { columns: [], data: [] };
    }

    // Determine max number of rankings across criteria
    let maxIndex = 0;
    criteriaLeaderboards.forEach((leaderboard) => {
      const validRankings = leaderboard.rankings.filter((r) => r.performanceValue !== null);
      if (validRankings.length > maxIndex) {
        maxIndex = validRankings.length;
      }
    });

    // Build table data by student index (shifts students upward to fill gaps)
    const rows: LeaderboardRow[] = [];
    for (let index = 0; index < maxIndex; index++) {
      const values: Record<string, CriterionRanking | null> = {};
      let rowRank: number | null = null;
      
      criteriaLeaderboards.forEach((leaderboard) => {
        const validRankings = leaderboard.rankings.filter((r) => r.performanceValue !== null);
        if (index < validRankings.length) {
          const ranking = validRankings[index];
          values[leaderboard.criterionName] = ranking;
          // Use the first criterion's rank for the place column
          if (rowRank === null && ranking.rank !== null) {
            rowRank = ranking.rank;
          }
        } else {
          values[leaderboard.criterionName] = null;
        }
      });
      
      rows.push({ rank: rowRank || index + 1, values });
    }

    const columnHelper = createColumnHelper<LeaderboardRow>();
    const tableColumns: import('@tanstack/react-table').ColumnDef<LeaderboardRow, any>[] = [
      columnHelper.accessor('rank', {
        header: 'Posto',
        cell: (info) => <span className="font-semibold text-sm">{info.getValue()}.</span>,
        size: 80,
      }),
    ];

    criteriaLeaderboards.forEach((leaderboard) => {
      const criterionName = leaderboard.criterionName;
      const unit = leaderboard.unit || 'reps';
      tableColumns.push(
        columnHelper.accessor(
          (row) => row.values[criterionName],
          {
            header: criterionName,
            id: criterionName,
            cell: (info) => {
              const ranking = info.getValue();
              if (!ranking) return '-';
              return <RankingCell ranking={ranking} unit={unit} />;
            },
            size: 240,
          }
        ) as any
      );
    });

    return { columns: tableColumns, data: rows };
  }, [criteriaLeaderboards]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Caricamento della classifica...</p>
      </div>
    );
  }

  if (criteriaLeaderboards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Seleziona un esercizio per visualizzare la classifica</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Nessuna valutazione trovata per questo esercizio e classe</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="text-center"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const rank = (row.original as any).rank;
            let rowBgClass = '';
            if (rank === 1) {
              rowBgClass = 'bg-amber-400/10';
            } else if (rank === 2) {
              rowBgClass = 'bg-slate-300/10';
            } else if (rank === 3) {
              rowBgClass = 'bg-amber-700/10';
            }
            return (
              <TableRow key={row.id} className={rowBgClass}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center py-2 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface RankingCellProps {
  ranking: CriterionRanking;
  unit?: string;
}

function RankingCell({ ranking, unit = 'reps' }: RankingCellProps) {
  if (ranking.performanceValue === null || ranking.rank === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const normalUnit = unit === 'reps' ? 'reps' : unit === 'sec' ? 's' : unit === 'cm' ? 'cm' : unit === 'm' ? 'm' : unit;

  const [firstName, ...lastParts] = ranking.studentName.split(' ');
  const lastName = lastParts.join(' ');

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1">
      <span className="text-sm font-semibold text-slate-50 leading-tight">{firstName}</span>
      {lastName && (
        <span className="text-xs font-medium text-slate-400 leading-tight">{lastName}</span>
      )}
      {ranking.studentClass && (
        <span className="text-xs text-slate-500 leading-tight">{ranking.studentClass}</span>
      )}
      <span className="font-semibold text-[0.95rem] text-slate-50 tracking-wide">
        {typeof ranking.performanceValue === 'number'
          ? ranking.performanceValue.toFixed(1)
          : ranking.performanceValue}{' '}
        <span className="text-[0.7rem] text-slate-400">{normalUnit}</span>
      </span>
    </div>
  );
}
