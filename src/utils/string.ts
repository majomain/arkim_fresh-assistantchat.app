export const truncateTitle = (input: string, end = 30) =>
    input.length > end ? `${input.substring(0, end - 3)}...` : input;
