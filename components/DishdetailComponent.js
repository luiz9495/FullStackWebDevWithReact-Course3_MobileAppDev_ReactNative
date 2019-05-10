import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, StyleSheet, Modal, Alert, PanResponder } from 'react-native';
import { Card, Icon, Button, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
      dishes: state.dishes,
      comments: state.comments,
      favorites: state.favorites
    }
}

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (commentId, dishId, rating, author, comment) => dispatch(postComment(commentId, dishId, rating, author, comment))
})

function RenderDish(props) {
  const dish = props.dish;

  handleViewRef = ref => this.view = ref;

  const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
    if (dx < -200)
      return true;
    else
      return false;
  };

  const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gestureState) => {
        return true;
      },
      onPanResponderGrant: () => {
        this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
      },
      onPanResponderEnd: (e, gestureState) => {
        console.log("pan responder end", gestureState);
        if (recognizeDrag(gestureState))
          Alert.alert(
            'Add to Favorites?',
            'Are you sure you wish to add ' + dish.name + ' to favorites ?',
            [
              {
                text: 'Cancel',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel'
              },
              {
                text: 'OK',
                onPress: () => {props.favorite ? console.log('Already favorite') : props.onPress()}
              }
            ],
            { cancelable: false}
          );
        return true;
      }
  });

  if (dish != null) {
      return(
        <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
          ref={this.handleViewRef}
          {...panResponder.panHandlers}>
          <Card
          featuredTitle={dish.name}
          image={{uri: baseUrl + dish.image}}>
              <Text style={{margin: 10}}>
                  {dish.description}
              </Text>
              <View style={styles.formRow}>
                <Icon
                    raised
                    reverse
                    name={ props.favorite ? 'heart' : 'heart-o'}
                    type='font-awesome'
                    color='#f50'
                    onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
                />
                <Icon
                    raised
                    reverse
                    name={'pencil'}
                    type='font-awesome'
                    color='#512DA8'
                    onPress={() => props.onPress2()}
                />
              </View>
          </Card>
        </Animatable.View>
      );
  }
  else {
      return(<View></View>);
  }
}

function RenderComments(props) {
  const comments = props.comments;

  const renderCommentItem = ({item, index}) => {
    return (
      <View key={index} style={{margin:10}}>
        <Text style={{fontSize:14}}>{item.comment}</Text>
        <Text style={{fontSize:12}}>{item.rating} Stars</Text>
        <Text style={{fontSize:12}}>{'-- ' + item.author + ', ' + item.date}</Text>
      </View>
    );
  }

  if (comments != null) {
    return(
      <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
        <Card title='Comments'>
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={item => item.id.toString()}
          />
        </Card>
      </Animatable.View>
    );
  }
  else {
      return(<View></View>);
  }
}

class Dishdetail extends Component {

  constructor(props) {
      super(props);

      this.state = {
          rating: 1,
          author: '',
          comment: '',
          showModal: false
      };
  }

  componentDidMount() {
    this.props.navigation.setParams({
      title: this.props.dishes.dishes[this.props.navigation.getParam("dishId")]
        .name
    });
  }

  static navigationOptions = {
      title: 'Dish Details'
  };

  markFavorite(dishId) {
      this.props.postFavorite(dishId);
  }

  handleComment(dishId) {
      this.props.postComment(
        this.props.comments.comments[this.props.comments.comments.length - 1].id + 1,
        dishId,
        this.state.rating,
        this.state.author,
        this.state.comment);
      this.toggleModal();
  }

  toggleModal() {
    console.log(JSON.stringify(this.state));
    this.setState({ showModal: !this.state.showModal})
  }

  resetForm() {
    console.log("resetForm: " + this.state.showModal);
    this.setState({
      rating: 3,
      author: '',
      comment: '',
      showModal: false
    });
  }

  ratingCompleted = (rating) => {
      console.log("Rating is: " + rating);
      this.setState({rating: rating});
  }

  render() {
      const dishId = this.props.navigation.getParam('dishId','');
      return(
        <ScrollView>

          <RenderDish dish={this.props.dishes.dishes[+dishId]}
            favorite={this.props.favorites.some(el => el === dishId)}
            onPress={() => this.markFavorite(dishId)}
            onPress2={() => this.toggleModal() }
          />

          <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />

          <Modal
            animationType={'slide'}
            transparent={false}
            visible={this.state.showModal}
//            onDismiss={ () => this.toggleModal() }
//            onRequestClose={ () => this.toggleModal() }
          >
          <View style={styles.modal}>
             <Rating
              name='rating'
              type='custom'
              showRating
              ratingCount={5}
              startingValue={this.state.rating}
              marginBottom={20}
              onFinishRating={this.ratingCompleted} //{rating => this.setState({rating: rating })}
             />
             <Input
                name='author'
                placeholder=' Author'
                leftIcon={{ type: 'font-awesome', name: 'user-o', marginRight: 10 }}
//                onChangeText={this.handleChange}
                onChangeText={ (text) => this.setState({author: text})}
                value={this.state.author}
              />
              <Input
                name='comment'
                placeholder=' Comment'
                leftIcon={{ type: 'font-awesome', name: 'comment-o', marginRight: 10}}
                onChangeText={ (text) => this.setState({comment: text})}
                value={this.state.comment}
//                 onChangeText={(value) => this.setState({comment: value})}
               />

             <Button
                buttonStyle={styles.submitButton}
                title="SUBMIT"
                onPress = {() => {
                  this.handleComment(dishId);
                  this.resetForm();
//                  this.toggleModal();
                  }
                }
              />
             <Button
                  buttonStyle={styles.cancelButton}
                  title="CANCEL"
                  onPress = {() => this.toggleModal() }
                 />
          </View>
        </Modal>

        </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
    formRow: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      flexDirection: 'row',
      margin: 20
    },
    modal: {
      justifyContent: 'center',
      margin: 20
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      backgroundColor: '#512DA8',
      textAlign: 'center',
      color: 'white',
      marginBottom: 20
  },
  modalText: {
      fontSize: 18,
      margin: 10
  },
  submitButton:{
    backgroundColor: '#512DA8',
    margin: 20
  },
  cancelButton:{
    backgroundColor: '#808080',
    margin: 20
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);
