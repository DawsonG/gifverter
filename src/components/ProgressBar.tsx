import './ProgressBar.css';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar = ({ progress }: ProgressBarProps): JSX.Element => <div className='progressBar'>
    <div style={{
        height: '24px',
        backgroundColor: 'red',
        width: `${Math.ceil(progress * 100)}%`
    }} />
</div>;

export default ProgressBar;