import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionStat {
  section: string;
  totalStudents: number;
  attendingCount: number;
  paidCount: number;
  pendingCount: number;
  notConfirmedCount: number;
}

interface SectionStatisticsProps {
  sectionStats: SectionStat[];
}

export function SectionStatistics({ sectionStats }: SectionStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Status</CardTitle>
      </CardHeader>
      <CardContent>
        {sectionStats.map((section, index) => (
          <div key={section.section} className={index < sectionStats.length - 1 ? "mb-5" : ""}>
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-700">Section {section.section}</h3>
              <span className="text-sm text-gray-500">
                {section.attendingCount}/{section.totalStudents} Students
              </span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${(section.attendingCount / section.totalStudents) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                {Math.round((section.attendingCount / section.totalStudents) * 100)}%
              </span>
            </div>
            <div className="flex items-center text-sm space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs text-gray-500">{section.paidCount} Paid</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-amber-500 mr-1"></div>
                <span className="text-xs text-gray-500">{section.pendingCount} Pending</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-gray-300 mr-1"></div>
                <span className="text-xs text-gray-500">{section.notConfirmedCount} Not Confirmed</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
