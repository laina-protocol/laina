import type { PropsWithChildren } from 'react';

export interface TableProps {
  headers: (string | null)[];
  className?: string;
}

export const Table = ({ children, headers }: PropsWithChildren<TableProps>) => {
  return (
    <table className="table text-base">
      <thead>
        <tr>
          {headers.map((title, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: no better key
            <th className="text-base font-semibold first:pl-1" key={idx}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
};
