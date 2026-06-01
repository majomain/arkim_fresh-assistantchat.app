'use client';

import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@/components/ui/accordian";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WorkLogDetail, WorkLogOutcome, WorkOrderDetail } from "@/types/workOrder/workOrder";
import { Calendar1, Footprints, ReceiptText, User, Wrench } from "lucide-react";

export default function WorkLogDialog({ workOrder, children }: { workOrder: WorkOrderDetail; children: React.ReactNode }) {
    // get the date from utc timestamp
    function getDateFromTimestamp(timestamp: string) {
        const date = new Date(timestamp);

        return date.toLocaleString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        })
            .replace(",", "");
    }

    // get the outcome label for worklog UI
    function getWorkLogOutcomeLabel(outcome?: WorkLogOutcome) {
        if (!outcome) {
            return '';
        }

        let label = '';
        switch (outcome) {
            case 'fixed': label = 'Fixed';
                break;
            case 'partially_fixed': label = 'Partially Fixed';
                break;
            case 'not_fixed': label = 'Not Fixed';
                break;
        }

        return label;
    }

    function getPerformBy(workLog: WorkLogDetail) {
        return workLog.performedByFirstName && workLog.performedByLastName ?
            workLog.performedByFirstName + ' ' + workLog.performedByLastName :
            workLog.performedByFirstName
                ? workLog.performedByFirstName :
                workLog.performedBy;
    }

    return <Dialog>
        <DialogTrigger asChild className="cursor-pointer">
            {children}
        </DialogTrigger>
        <DialogContent>
            <DialogTitle>
                Work Logs
            </DialogTitle>
            <DialogDescription />
            <div className='max-h-[80dvh] overflow-y-auto pr-1 flex flex-col gap-5'>
                {
                    workOrder.workLogs && workOrder?.workLogs.length && workOrder.workLogs.map((workLog, index) => {
                        return <Accordion key={`work-log-${index}`} className='border px-2 rounded-md'>
                            <AccordionItem hideBorder={true} defaultOpen={false}>
                                <AccordionHeader>
                                    <p className='flex flex-row items-center gap-1 text-sm font-semibold'>
                                        <User className='size-4' />
                                        {getPerformBy(workLog)}
                                    </p>
                                </AccordionHeader>
                                <AccordionContent smoothHide={true}>
                                    <div className='bg-muted/30 flex flex-col gap-3 mb-2 pt-4 pb-2 px-2 rounded-md'>
                                        <div className='flex flex-row justify-between items-center'>
                                            <p className='flex flex-row items-center gap-1 text-xs font-semibold'>
                                                <Calendar1 className='size-3' />
                                                {getDateFromTimestamp(workLog?.performedAtUtc ?? '')}
                                            </p>
                                            <Badge variant='secondary' className={cn(
                                                workLog.outcome === 'fixed'
                                                    ?
                                                    'bg-success/20 text-success'
                                                    :
                                                    workLog.outcome === 'partially_fixed'
                                                        ?
                                                        'bg-warning/20 text-warning'
                                                        :
                                                        'bg-destructive/20 text-destructive'
                                            )}>
                                                {getWorkLogOutcomeLabel(workLog?.outcome ?? undefined)}
                                            </Badge>
                                        </div>

                                        {
                                            workLog.troubleshootingSteps && <div className='flex flex-col gap-2'>
                                                <Separator className='mb-2' />
                                                <p className='text-xs font-semibold text-muted-foreground flex flex-row items-center gap-1'><Footprints className="size-3.5" />Troubleshooting steps</p>
                                                <p className='text-sm whitespace-pre-wrap'>{workLog.troubleshootingSteps}</p>
                                            </div>
                                        }

                                        {
                                            workLog.comments && <div className='flex flex-col gap-2'>
                                                <Separator className='mb-2' />
                                                <p className='text-xs font-semibold text-muted-foreground flex flex-row items-center gap-1'><ReceiptText className="size-3.5" />Comments</p>
                                                <p className='text-sm whitespace-pre-wrap'>{workLog.comments}</p>

                                                {
                                                    workLog.parts && workLog.parts.length && <Separator className='mt-2' />
                                                }
                                            </div>
                                        }

                                        {
                                            workLog.parts && workLog.parts.length && <div className='flex flex-col gap-5'>
                                                <Accordion className="-mt-2">
                                                    <AccordionItem hideBorder={true} defaultOpen={false}>
                                                        <AccordionHeader>
                                                            <p className="flex flex-row items-center gap-2 text-sm font-semibold"><Wrench className="size-3.5" />Parts Used</p>
                                                        </AccordionHeader>
                                                        <AccordionContent smoothHide={true}>
                                                            <div className="flex flex-col gap-5 pb-2">
                                                                {workLog.parts.map((part, idx) => {
                                                                    return <div key={`part-${index}-${idx}`} className='bg-card p-2 rounded-md flex flex-col gap-2'>
                                                                        <div className='grid grid-cols-2 gap-5'>
                                                                            <p className='text-xs font-semibold text-muted-foreground flex flex-col gap-1'>Manufacturer<span className='!text-sm !font-normal !text-foreground'>{part.manufacturer}</span></p>
                                                                            <p className='text-xs font-semibold text-muted-foreground flex flex-col gap-1'>Model<span className='!text-sm !font-normal !text-foreground'>{part.model}</span></p>
                                                                            <p className='text-xs font-semibold text-muted-foreground flex flex-col gap-1'>Part Number<span className='!text-sm !font-normal !text-foreground'>{part.partNumber}</span></p>
                                                                            <p className='text-xs font-semibold text-muted-foreground flex flex-col gap-1'>Quantity<span className='!text-sm !font-normal !text-foreground'>{part.quantity}</span></p>
                                                                        </div>

                                                                        <Separator />

                                                                        <div className='flex flex-col gap-2'>
                                                                            <p className='text-xs font-semibold text-muted-foreground'>Comments</p>
                                                                            <p className='text-sm whitespace-pre-wrap'>{part.comments}</p>
                                                                        </div>
                                                                    </div>
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </div>
                                        }
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    })
                }
            </div>
        </DialogContent>
    </Dialog>;
}