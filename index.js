const path = require('path');
const {sync: findUp} = require('find-up');
const Generator = require('yeoman-generator');

const CUSTOM_PRIORITIES = [
  {
    priorityName: 'mainMenu',
    queueName: 'mainMenu',
    before: 'prompting'
  },
  {
    priorityName: 'preConflicts',
    queueName: 'preConflicts',
    before: 'conflicts'
  },
  {
    priorityName: 'postWriting',
    queueName: 'postWriting',
    before: 'preConflicts'
  },
  {
    priorityName: 'composing',
    queueName: 'composing',
    before: 'default'
  }
];

module.exports = class CommonGenerator extends Generator {
  constructor(args, options, features) {
    super(args, options, {unique: true, taskPrefix: '#', ...features});

    if (!this.options.localConfigOnly && this.features.uniqueGlobally) {
      const regenerateDirectory = findUp(
        directory => {
          const yoRcPath = path.join(directory, '.yo-rc.json');
          const hasYoRc = findUp.exists(yoRcPath);
          if (!hasYoRc) return false;
          try {
            const yoRc = require(yoRcPath);
            return yoRc[this.rootGeneratorName()] && directory;
          } catch {
            return false;
          }
        },
        {type: 'directory'}
      );
      if (regenerateDirectory) {
        this.destinationRoot(regenerateDirectory);
      } else {
        let upperDirectory;
        findUp(
          directory => {
            const yoRcPath = path.join(directory, '.yo-rc.json');
            const hasYoRc = findUp.exists(yoRcPath);
            if (hasYoRc) {
              upperDirectory = directory;
            }

            return false;
          },
          {type: 'directory'}
        );
        if (upperDirectory) {
          this.destinationRoot(upperDirectory);
        }
      }
    }

    if (this.options.help) {
      return;
    }

    this.compose = this.env.createCompose(this.destinationRoot());

    this.registerPriorities(CUSTOM_PRIORITIES);

    this.storage = this.config.createProxy();

    this._namespaceId = this.env.requireNamespace(this.features.uniqueBy);

    // Create config for the generator and instance
    if (this._namespaceId && this._namespaceId.generator) {
      this.generatorConfig = this.config.createStorage(`:${this._namespaceId.generator}`);
      if (this._namespaceId.instanceId) {
        this.instanceConfig = this.generatorConfig.createStorage(`#${this._namespaceId.instanceId}`);
      }
    }
  }

  queueOwnTasks(...args) {
    if (this.features.disableable && this.config.get('disabled')) {
      return undefined;
    }

    return super.queueOwnTasks(...args);
  }
};
