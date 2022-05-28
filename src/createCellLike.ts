export const createCellLike = ({ MESSAGE }: { MESSAGE: string }) => {
  return () => `${MESSAGE} upgraded.`
}
