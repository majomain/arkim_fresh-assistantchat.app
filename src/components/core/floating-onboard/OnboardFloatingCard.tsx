'use client';

import { useAssetBroadcast } from '@/hooks/broadcasts/use-asset-broadcast';
import { useAsset } from '@/hooks/use-asset';
import { useDraggableCard } from '@/hooks/use-draggable-card';
import { useLocation } from '@/hooks/use-location';
import equipmentService from '@/services/api/equipmentService';
import { AssetDetail, AssetWithThreads } from '@/types/equipment/asset';
import { useEffect, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

import DraggableCard from '../../ui/DraggableCard';
import AssetExist from './stages/AssetExist';
import AssetForm from './stages/AssetForm';
import Initiate from './stages/Initiate';
import SearchAsset from './stages/SearchAsset';
import Success from './stages/Success';

type StageType =
    | 'asset-form'
    | 'search'
    | 'asset-exist'
    | 'initiate'
    | 'success';

export default function OnboardFloatingCard() {
    // draggable card util
    const { cards } = useDraggableCard();
    // disable card closure state
    const [disableCard, setDisableCard] = useState<boolean>(false);
    // notify card state
    const [notify, setNotify] = useState<boolean>(false);

    // stage state
    const [stage, setStage] = useState<StageType>('asset-form');

    // make form data
    const [make, setMake] = useState<string>('');
    // model form data
    const [model, setModel] = useState<string>('');
    // label form data
    const [label, setLabel] = useState<string>('');
    // type form data
    const [type, setType] = useState<string>('');

    // list of assets
    const { assetList, refreshAssetList } = useAsset();
    // selected location
    const { selectedLocation } = useLocation();

    // store asset id if already exist
    const [foundAssetId, setFoundAssetId] = useState<string | null>(null);

    // broadcasting setup
    const { assetCreated } = useAssetBroadcast((event) => {
        if (event.type === 'ASSET_CREATED') refreshAssetList();
    });

    // reset the whole process
    async function reset() {
        // reset card related utils
        setDisableCard(false);
        // reset form utils
        setMake('');
        setModel('');
        setLabel('');
        setType('');
        // loop back to stage 1
        setStage('asset-form');
    }

    // initiate the onboarding process by creating a new asset
    async function initiateOnboarding() {
        try {
            setDisableCard(true);

            const payload: AssetDetail = {
                id: '',
                name: label.trim(),
                type: type.trim(),
                siteId: selectedLocation?.id || '',
                manufacturer: make.trim() || '',
                model: model.trim() || '',
                archived: null,
                archivedBy: null,
                archivedAt: null,
            };

            // create new asset
            await equipmentService.create(payload);

            const updatedAssets = await refreshAssetList();

            const assetExists = updatedAssets.find(
                (ast) =>
                    ast?.manufacturer.includes(make.trim()) &&
                    ast?.model.includes(model.trim()),
            );

            if (assetExists) {
                setFoundAssetId(assetExists.id);
            }

            assetCreated();

            setStage('success');
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
            if (error.status !== 422) {
                reset();
                throw new Error(error.message);
            }
        } finally {
            setDisableCard(false);
        }
    }

    // start the onboarding process
    async function startProcess() {
        try {
            setStage('search');

            // filter the asset list using the asset id
            const assetExists = assetList.find(
                (ast: AssetWithThreads) =>
                    ast?.manufacturer.includes(make.trim()) &&
                    ast?.model.includes(model.trim()),
            );

            // if asset exists then switch to that asset else move on to next stage
            if (assetExists) {
                setFoundAssetId(assetExists.id);
                setStage('asset-exist');
            } else {
                setStage('initiate');
            }
        } catch (error: any) {
            return;
        }
    }

    // update UI and process as per stage change
    useEffect(() => {
        if (stage === 'initiate') {
            initiateOnboarding();
        }

        if (cards['onboard']?.minimized) {
            setNotify(true);
        }
    }, [stage]);

    // nullify notification when card is minimized
    useEffect(() => {
        if (!cards['onboard']?.minimized) {
            setNotify(false);
        }
    }, [cards['onboard']?.minimized]);

    // reset everything when card is closed
    useEffect(() => {
        if (!cards['onboard']?.open) {
            reset();
        }
    }, [cards['onboard']?.open]);

    return (
        <DraggableCard
            draggable={false}
            id="onboard"
            title="Add New Asset"
            disableClose={disableCard}
            notify={notify}
        >
            {stage === 'asset-form' && (
                <AssetForm
                    make={make}
                    model={model}
                    label={label}
                    type={type}
                    setMake={setMake}
                    setModel={setModel}
                    setLabel={setLabel}
                    setType={setType}
                    startProcess={startProcess}
                />
            )}

            {stage === 'search' && <SearchAsset />}

            {stage === 'asset-exist' && (
                <AssetExist assetId={foundAssetId ?? ''} />
            )}

            {stage === 'initiate' && (
                <Initiate asset={`${make.trim()} ${model.trim()}`} />
            )}

            {stage === 'success' && <Success assetId={foundAssetId ?? ''} />}
        </DraggableCard>
    );
}
