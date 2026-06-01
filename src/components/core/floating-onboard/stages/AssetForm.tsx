'use client';

import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function AssetForm({
    make,
    model,
    label,
    type,
    setMake,
    setModel,
    setLabel,
    setType,
    startProcess,
}: {
    make: string;
    model: string;
    label: string;
    type: string;
    setMake: (make: string) => void;
    setModel: (model: string) => void;
    setLabel: (label: string) => void;
    setType: (type: string) => void;
    startProcess: () => void;
}) {
    // flag for create asset btn
    const [isCreateBtnDisable, setIsCreateBtnDisable] = useState<boolean>(true);

    // enable/disable create asset btn
    useEffect(() => {
        setIsCreateBtnDisable(
            make !== '' && model !== '' && label !== '' && type !== ''
                ? false
                : true,
        );
    }, [make, model, label, type]);

    return (
        <div className="flex flex-col items-center gap-10 px-4 py-2">
            <form className="flex flex-col gap-5">
                <div className="flex flex-row flex-wrap justify-between gap-5 w-full">
                    <div className="basis-full grid gap-2">
                        <Label htmlFor="type">
                            Asset Type
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Which type is this asset?
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input
                            id="type"
                            className="!border-muted"
                            placeholder="Rotary Screw Air Compressor"
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                            }}
                            maxLength={30}
                            required
                        />
                    </div>

                    <div className="w-full sm:basis-[calc(50%-0.625rem)] grid gap-2">
                        <Label htmlFor="make">
                            Make
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Name of the manufacturer of the asset
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input
                            id="make"
                            className="!border-muted"
                            placeholder="Atlas Copco"
                            value={make}
                            onChange={(e) => {
                                setMake(e.target.value);
                            }}
                            maxLength={30}
                            required
                        />
                    </div>

                    <div className="w-full sm:basis-[calc(50%-0.625rem)] grid gap-2">
                        <Label htmlFor="model">
                            Model
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Model name/number or ID of the asset
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input
                            id="model"
                            className="!border-muted"
                            placeholder="GA37"
                            value={model}
                            onChange={(e) => {
                                setModel(e.target.value);
                            }}
                            maxLength={30}
                            required
                        />
                    </div>

                    <div className="basis-full grid gap-2">
                        <Label htmlFor="label">
                            Asset Name
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="size-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    Name you’d like to use for the asset
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input
                            id="label"
                            className="!border-muted"
                            placeholder="Atlas Screw 1"
                            value={label}
                            onChange={(e) => {
                                setLabel(e.target.value);
                            }}
                            maxLength={30}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-row flex-wrap justify-end gap-2 w-full">
                    <Button
                        type="button"
                        variant="bevel"
                        disabled={isCreateBtnDisable}
                        onClick={startProcess}
                    >
                        Onboard
                    </Button>
                </div>
            </form>
        </div>
    );
}
