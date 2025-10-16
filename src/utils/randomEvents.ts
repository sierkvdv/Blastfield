
import events from '../data/events.json';

export function handleRandomEvents(eventPool: any[]) {
  // 10% chance of an event each turn
  if (Math.random() < 0.1) {
    const event = events[Math.floor(Math.random() * events.length)];
    console.log(`Random Event Triggered: ${event.name}`);
    // Handle each event accordingly (placeholder logic)
    switch (event.effect) {
      case 'area_damage':
        console.log('Meteor shower damages random areas');
        break;
      case 'wind_change':
        console.log('Wind intensity increases');
        break;
      case 'crate_drop':
        console.log('Supply crate dropped');
        break;
      case 'trajectory_curve':
        console.log('Trajectories curve unexpectedly');
        break;
      default:
        break;
    }
  }
}
