import { db } from '@/db';
import { mediaGenerations } from '@/db/schema';

async function main() {
    const sampleMediaGenerations = [
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            type: 'image',
            url: 'https://storage.verdeiq.com/media/solar-panels-rooftop-city-2024-01-15.png',
            prompt: 'Solar panel installation on office rooftop with green cityscape background',
            enhancedPrompt: 'Professional photorealistic visualization of solar panel installation on modern office building rooftop with sustainable green cityscape in background, high quality corporate sustainability report imagery',
            model: 'imagen-4.0-generate-001',
            modelReason: 'High-quality photorealistic rendering for corporate sustainability report',
            contextType: 'company_data',
            aspectRatio: '16:9',
            edited: false,
            editParameters: null,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            type: 'video',
            url: 'https://storage.verdeiq.com/media/emissions-timeline-animation-2024-01-18.mp4',
            prompt: 'Animated timeline showing carbon emissions reduction over 12 months',
            enhancedPrompt: 'Dynamic animated data visualization timeline showcasing monthly carbon emissions reduction progress with smooth transitions',
            model: 'gemini-2.5-flash-image',
            modelReason: 'Fast generation for animated data visualization',
            contextType: 'progress',
            aspectRatio: '16:9',
            edited: false,
            editParameters: null,
            createdAt: '2024-01-18T14:20:00.000Z',
            updatedAt: '2024-01-18T14:20:00.000Z',
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            type: 'image',
            url: 'https://storage.verdeiq.com/media/renewable-energy-chart-2024-01-22.png',
            prompt: 'Data visualization of renewable energy percentage increase',
            enhancedPrompt: 'Clean modern data visualization chart showing renewable energy adoption percentage growth',
            model: 'imagen-4.0-generate-001',
            modelReason: 'Professional chart visualization with enhanced color accuracy',
            contextType: 'insights',
            aspectRatio: '1:1',
            edited: true,
            editParameters: '{"brightness": 120, "contrast": 110, "saturation": 105}',
            createdAt: '2024-01-22T09:45:00.000Z',
            updatedAt: '2024-01-22T11:30:00.000Z',
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            type: 'image',
            url: 'https://storage.verdeiq.com/media/waste-reduction-infographic-2024-01-25.png',
            prompt: 'Infographic showing top 5 waste reduction strategies',
            enhancedPrompt: 'Professional infographic design presenting top 5 actionable waste reduction strategies',
            model: 'gemini-2.5-flash-image',
            modelReason: 'Quick generation for actionable infographic',
            contextType: 'recommendations',
            aspectRatio: '16:9',
            edited: true,
            editParameters: '{"grayscale": false, "rotation": 0, "sharpen": true}',
            createdAt: '2024-01-25T16:10:00.000Z',
            updatedAt: '2024-01-25T17:05:00.000Z',
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            type: 'video',
            url: 'https://storage.verdeiq.com/media/tree-planting-initiative-2024-01-28.mp4',
            prompt: 'Team planting trees in company sustainability initiative',
            enhancedPrompt: 'Cinematic quality video of diverse team members planting trees in corporate sustainability initiative',
            model: 'imagen-4.0-generate-001',
            modelReason: 'Cinematic quality video for corporate social responsibility showcase',
            contextType: 'custom',
            aspectRatio: '16:9',
            edited: false,
            editParameters: null,
            createdAt: '2024-01-28T13:00:00.000Z',
            updatedAt: '2024-01-28T13:00:00.000Z',
        }
    ];

    await db.insert(mediaGenerations).values(sampleMediaGenerations);
    
    console.log('✅ Media generations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});