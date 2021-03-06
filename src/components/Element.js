// @flow
import React from 'react';
import PropTypes from 'prop-types';
import shallowEqual from '../utils/shallowEqual';
import {type ElementContext, elementContextTypes} from './Elements';

type Props = {
  id?: string,
  className?: string,
  // DEPRECATED; remove in 2.0.0+
  elementRef?: Function,
  onChange: Function,
  onBlur: Function,
  onFocus: Function,
  onReady: Function,
};

const noop = () => {};

const _extractOptions = (props: Props): Object => {
  const {
    id,
    className,
    elementRef,
    onChange,
    onFocus,
    onBlur,
    onReady,
    ...options
  } = props;
  return options;
};

const Element = (type: string, hocOptions: {sourceType?: string} = {}) =>
  class extends React.Component<Props> {
    static propTypes = {
      id: PropTypes.string,
      className: PropTypes.string,
      elementRef: PropTypes.func,
      onChange: PropTypes.func,
      onBlur: PropTypes.func,
      onFocus: PropTypes.func,
      onReady: PropTypes.func,
    };
    static defaultProps = {
      id: undefined,
      className: undefined,
      elementRef: undefined,
      onChange: noop,
      onBlur: noop,
      onFocus: noop,
      onReady: noop,
    };

    static contextTypes = elementContextTypes;

    constructor(props: Props, context: ElementContext) {
      super(props, context);

      this._element = null;

      const options = _extractOptions(this.props);
      // We keep track of the extracted options on this._options to avoid re-rendering.
      // (We would unnecessarily re-render if we were tracking them with state.)
      this._options = options;
    }

    componentDidMount() {
      this.context.addElementsLoadListener((elements: ElementsShape) => {
        const element = elements.create(type, this._options);
        this._element = element;

        this._setupEventListeners(element);

        element.mount(this._ref);
        if (hocOptions.sourceType) {
          this.context.registerElement(hocOptions.sourceType, element);
        }
      });
    }
    componentWillReceiveProps(nextProps: Props) {
      const options = _extractOptions(nextProps);
      if (
        Object.keys(options).length !== 0 &&
        !shallowEqual(options, this._options)
      ) {
        this._options = options;
        if (this._element) {
          this._element.update(options);
        }
      }
    }
    componentWillUnmount() {
      if (this._element) {
        const element = this._element;
        element.destroy();
        this.context.unregisterElement(element);
      }
    }

    context: ElementContext;
    _element: ElementShape | null;
    _ref: ?HTMLElement;
    _options: Object;

    _setupEventListeners(element: ElementShape) {
      element.on('ready', () => {
        if (this.props.elementRef) {
          if (window.console && window.console.warn) {
            console.warn(
              "'elementRef()' is deprecated and will be removed in a future version of react-stripe-elements. Please use 'onReady()' instead."
            );
          }
          this.props.elementRef(this._element);
        }
        this.props.onReady(this._element);
      });

      element.on('change', change => {
        this.props.onChange(change);
      });

      element.on('blur', (...args) => this.props.onBlur(...args));
      element.on('focus', (...args) => this.props.onFocus(...args));
    }

    handleRef = (ref: ?HTMLElement) => {
      this._ref = ref;
    };

    render() {
      return (
        <div
          id={this.props.id}
          className={this.props.className}
          ref={this.handleRef}
        />
      );
    }
  };

export default Element;
