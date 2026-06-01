export type Steps = 'routing' |
    'rag_retrieval' |
    'web_search' |
    'metrics_analyzer' |
    'profile_answer';
export type Tags = 'thinking' |
    'rag_act' |
    'rag_observe' |
    'web_act' |
    'web_observe' |
    'analyze_metrics' |
    'metrics_reasoning' |
    'final_answer';
export type Types = 'thinking' |
    'rag_act' |
    'rag_observe' |
    'web_act' |
    'web_observe' |
    'analyze_metrics' |
    'response';

// steps are used to map with tag event
export type ProgressEventData = {
    step: Steps;
    message: string;
};

// tags are used to map with delta event
export type TagStartEventData = {
    step: Steps;
    tag: Tags;
};

export type DelteEventData = {
    step: Steps;
    tag: Tags;
    type: Types;
    delta: string;
};

export type TagEndEventData = {
    step: Steps;
    tag: Tags;
    content: string;
};

export interface StreamingDataType {
    response: string;
    thinking: ProgressType;
    reasoning: ReasoningType;
    isPosting: boolean;
}

export type ProgressEntry = {
    step: Steps;
    tag: Tags;
    title: string;
    content: string;
};

export type ProgressType = ProgressEntry[];

export type ReasoningEntry = {
    tag: Tags;
    title: string;
    content: string;
};

export type ReasoningType = Partial<Record<Tags, { title: string; content: string }>>;

export interface OptionsType {
    updateThinking: (step: Steps, tag: Tags, content: string) => void;
    updateReasoning: (tag: Tags, content: string) => void;
    appendThinking: (entry: ProgressEntry) => void;
    appendReasoning: (reasoning: ReasoningType) => void;
    appendResponse: (response: string) => void;
};

export class StreamlineChatHandler {

    private options: OptionsType;
    private currentProgress: string | null;
    private currentStep: Steps | null;
    private currentTag: Tags | null;

    constructor(options: OptionsType) {
        this.options = options;
        this.currentProgress = null;
        this.currentStep = null;
        this.currentTag = null;
    }

    // progress are used for the assistant's thinking title/header
    public handleProgressEvent(data: ProgressEventData) {
        this.currentStep = data.step;
        this.currentProgress = data.message;
    }

    // tag start event is the checkpoint from where the content will start from the next event
    public handleTagStartEvent(data: TagStartEventData) {
        this.currentStep = data?.step ?? null;
        this.currentTag = data?.tag ?? null;

        if (this.currentStep && this.currentTag && this.currentTag !== 'final_answer') {
            this.options.appendThinking({
                step: this.currentStep,
                tag: this.currentTag,
                title: this.currentProgress ?? '',
                content: ''
            });
        }

        if (this.currentTag !== 'final_answer') {
            const reasoning: ReasoningType = {
                [data.tag as Tags]: { title: this.currentProgress, content: '' }
            }
            this.options.appendReasoning(reasoning);
        }
    }

    // delta event holds all the chunked data
    public handleDeltaEvent(data: DelteEventData) {
        if (!this.currentStep || !this.currentTag || this.currentStep !== data.step || this.currentTag !== data.tag) return;

        if (data.type === 'response' && (this.currentStep === 'routing' || data.step === 'profile_answer')) {
            this.options.appendResponse(data.delta);
        }
        else {
            this.options.updateThinking(this.currentStep, this.currentTag, data.delta);
            if (this.currentTag !== 'final_answer') {
                this.options.updateReasoning(this.currentTag, data.delta);
            }
        }
    }

    // tag end event is the final point which indicates the end of content for a particular progress step
    public handleTagEndEvent(data?: TagEndEventData) {
        if (!this.currentStep || !this.currentTag) return;

        this.currentStep = null;
        this.currentTag = null;
    }
}