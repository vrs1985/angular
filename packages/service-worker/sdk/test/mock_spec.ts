import {TestWorkerDriver} from '../testing/src/mock';

class TestWorker {}

export function main() {
  describe('TestWorkerDriver (mock)', () => {
    let driver: TestWorkerDriver;
    beforeEach(() => { driver = new TestWorkerDriver(() => new TestWorker); });
    it('properly passes install events through',
       (done: DoneFn) => { driver.triggerInstall().then(() => done()); });
  });
}
